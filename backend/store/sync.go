package store

import (
	"context"
	"fmt"
	"log/slog"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"unicode"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"
)

type SheetMajorMapping struct {
	MajorTitle string
	School     string
	Category   enums.CourseCategory
}

func requirementTypeFromSheetCourseType(raw string) enums.RequirementType {
	raw = strings.ToLower(strings.TrimSpace(raw))
	if strings.Contains(raw, "major core") || strings.Contains(raw, "core") || strings.Contains(raw, "обязательный") {
		return enums.RequirementTypeMajorCore
	}
	if strings.Contains(raw, "major choice") {
		return enums.RequirementTypeMajorChoice
	}
	if strings.Contains(raw, "flex") {
		return enums.RequirementTypeFlex
	}
	if strings.Contains(raw, "общеуниверситетский") || strings.Contains(raw, "универ") {
		return enums.RequirementTypeUniversity
	}
	if strings.Contains(raw, "факультатив") {
		return enums.RequirementTypeElective
	}
	if strings.Contains(raw, "minor") || strings.Contains(raw, "майнор") {
		return enums.RequirementTypeMinor
	}
	if strings.Contains(raw, "soft") || strings.Contains(raw, "софт") {
		return enums.RequirementTypeSoft
	}
	if strings.Contains(raw, "selected topics") {
		return enums.RequirementTypeSelectedTopics
	}
	// fallback
	return enums.RequirementTypeElective
}

var SheetToMajor = map[string]SheetMajorMapping{
	"Бизнес и аналитика":      {"Бизнес и аналитика", "Business", enums.CourseCategoryBusiness},
	"Искусственный интеллект": {"Искусственный интеллект", "Tech", enums.CourseCategoryAI},
	"Разработка":              {"Разработка", "Tech", enums.CourseCategorySWE},
}

type SyncResult struct {
	Courses           int
	Majors            int
	MajorRequirements int
}

type sheetsConfig struct {
	SpreadsheetID   string
	CredentialsJSON string
	SheetNames      []string
}

var sheetsCfg sheetsConfig

func SetSheetsConfig(spreadsheetID, credentialsJSON string, sheetNames []string) {
	sheetsCfg = sheetsConfig{
		SpreadsheetID:   spreadsheetID,
		CredentialsJSON: credentialsJSON,
		SheetNames:      sheetNames,
	}
}

func guessSheetMapping(title string) (SheetMajorMapping, bool) {
	if m, ok := SheetToMajor[title]; ok {
		return m, true
	}

	lower := strings.ToLower(title)

	type kwEntry struct {
		keywords []string
		mapping  SheetMajorMapping
	}
	keywordMap := []kwEntry{
		{[]string{"бизнес", "business", "экономика", "финанс", "маркетинг", "аналитик"}, SheetMajorMapping{"Бизнес и аналитика", "Business", enums.CourseCategoryBusiness}},
		{[]string{"искусственный интеллект", "интеллект", "machine learning", "deep learning", "ml", "dl", "ai", "ии", "нейро"}, SheetMajorMapping{"Искусственный интеллект", "Tech", enums.CourseCategoryAI}},
		{[]string{"разработка", "software", "программирован", "программист", "swe", "engineering", "development", "web", "mobile", "backend", "frontend"}, SheetMajorMapping{"Разработка", "Tech", enums.CourseCategorySWE}},
		{[]string{"дизайн", "design", "ux", "ui", "график"}, SheetMajorMapping{"Дизайн", "Design", enums.CourseCategoryDesign}},
		{[]string{"общ", "common", "general", "fundamental", "базов", "основ"}, SheetMajorMapping{"Общие", "Common", enums.CourseCategoryFundamentals}},
		{[]string{"stem", "стем"}, SheetMajorMapping{"STEM", "STEM", enums.CourseCategorySTEM}},
		{[]string{"soft", "софт"}, SheetMajorMapping{"Soft", "Soft", enums.CourseCategorySoft}},
	}

	for _, entry := range keywordMap {
		for _, kw := range entry.keywords {
			if strings.Contains(lower, kw) {
				return entry.mapping, true
			}
		}
	}

	return SheetMajorMapping{}, false
}

func SyncFromSheetData(s interfaces.StoreBase, sheetsData map[string][]map[string]string, sheetMapping map[string]SheetMajorMapping) (SyncResult, error) {
	// Load existing data to preserve UUIDs across re-syncs.
	existingCourseByNorm := make(map[string]uuid.UUID)
	existingCourses, err := s.GetAllCourses()
	if err != nil {
		return SyncResult{}, fmt.Errorf("get existing courses: %w", err)
	}
	for id, c := range existingCourses {
		if len(c.AllowedCohorts) > 0 {
			for _, year := range c.AllowedCohorts {
				existingCourseByNorm[c.Title+"|"+strconv.Itoa(year)] = id
			}
		} else {
			existingCourseByNorm[c.Title+"|0"] = id
		}
	}

	existingMajorByKey := make(map[string]uuid.UUID)
	existingMajors, err := s.GetAllMajors()
	if err != nil {
		return SyncResult{}, fmt.Errorf("get existing majors: %w", err)
	}
	for id, m := range existingMajors {
		key := m.Title
		if m.CohortYear != 0 {
			key = fmt.Sprintf("%s (%d)", m.Title, m.CohortYear)
		}
		existingMajorByKey[key] = id
	}

	existingReqs, err := s.GetAllMajorRequirements()
	if err != nil {
		return SyncResult{}, fmt.Errorf("get existing major requirements: %w", err)
	}
	existingReqByPair := make(map[string]uuid.UUID)
	for _, r := range existingReqs {
		key := r.MajorID.String() + "\x00" + r.CourseID.String()
		existingReqByPair[key] = r.ID
	}

	existingDeps, err := s.GetCourseDependencies()
	if err != nil {
		return SyncResult{}, fmt.Errorf("get existing dependencies: %w", err)
	}
	existingDepByPair := make(map[string]uuid.UUID)
	for _, d := range existingDeps {
		key := d.CourseID.String() + "\x00" + d.RequiredCourseID.String() + "\x00" + string(d.DependencyType)
		existingDepByPair[key] = d.ID
	}

	if err := s.ClearAll(); err != nil {
		return SyncResult{}, fmt.Errorf("clear store: %w", err)
	}

	majorsByTitle := make(map[string]interfaces.MajorData)
	courseMap := make(map[string]interfaces.CourseData)
	type reqInfo struct {
		reqType         enums.RequirementType
		specializations []string
	}
	courseToMajorReqs := make(map[string]map[string]reqInfo)
	type rowEntry struct {
		Row       map[string]string
		Course    interfaces.CourseData
		SheetYear int
	}
	var allRows []rowEntry

	for sheetName, rows := range sheetsData {
		mapping, ok := sheetMapping[sheetName]
		if !ok {
			slog.Warn("unknown sheet, skipping", "sheet", sheetName)
			continue
		}

		sheetYear := 0
		if matches := YearRegexp.FindString(sheetName); matches != "" {
			if year, err := strconv.Atoi(matches); err == nil {
				sheetYear = year
			}
		}

		for _, row := range rows {
			title := strings.Join(strings.Fields(getFirst(row, "Название курса")), " ")
			if title == "" {
				continue
			}

			normTitle := title
			norm := normTitle + "|" + strconv.Itoa(sheetYear)

			cohorts := parseAllowedCohorts(getFirst(row, "Поток"))
			if len(cohorts) == 0 {
				if matches := YearRegexp.FindString(sheetName); matches != "" {
					if year, err := strconv.Atoi(matches); err == nil {
						cohorts = []int{year}
					}
				}
			}

			var majors []interfaces.MajorData
			if mapping.Category != enums.CourseCategoryFundamentals && mapping.Category != enums.CourseCategorySTEM && mapping.Category != enums.CourseCategorySoft {
				if len(cohorts) == 0 {
					majors = append(majors, interfaces.MajorData{ID: uuid.New(), Title: mapping.MajorTitle, School: mapping.School})
				} else {
					for _, c := range cohorts {
						majors = append(majors, interfaces.MajorData{ID: uuid.New(), Title: mapping.MajorTitle, School: mapping.School, CohortYear: c})
					}
				}
			}

			reqType := requirementTypeFromSheetCourseType(getFirst(row, "Тип курса"))
			rawSpecs := getFirst(row, "Специализация", "Специализации")
			var specs []string
			if rawSpecs != "" && rawSpecs != "-" {
				for _, sPart := range strings.Split(rawSpecs, ",") {
					sPart = strings.TrimSpace(sPart)
					if sPart != "" && !strings.EqualFold(sPart, "нет") {
						specs = append(specs, sPart)
					}
				}
			}

			if _, exists := courseMap[norm]; !exists {
				course := MapSheetRowToCourse(row, mapping.Category)
				if len(course.AllowedCohorts) == 0 {
					if matches := YearRegexp.FindString(sheetName); matches != "" {
						if year, err := strconv.Atoi(matches); err == nil {
							course.AllowedCohorts = []int{year}
						}
					}
				}
				if existingID, ok := existingCourseByNorm[norm]; ok {
					course.ID = existingID
					// Remove it so another cohort doesn't steal the same ID and cause merged dependencies
					delete(existingCourseByNorm, norm)
				}
				if _, err := s.CreateCourse(course); err != nil {
					return SyncResult{}, fmt.Errorf("create course %s: %w", title, err)
				}
				courseMap[norm] = course
				courseToMajorReqs[norm] = make(map[string]reqInfo)
				allRows = append(allRows, rowEntry{Row: row, Course: course, SheetYear: sheetYear})
			} else {
				course := courseMap[norm]
				rowCohorts := parseAllowedCohorts(getFirst(row, "Поток"))
				if len(rowCohorts) == 0 {
					if matches := YearRegexp.FindString(sheetName); matches != "" {
						if year, err := strconv.Atoi(matches); err == nil {
							rowCohorts = []int{year}
						}
					}
				}
				modified := false
				for _, rc := range rowCohorts {
					found := false
					for _, ac := range course.AllowedCohorts {
						if ac == rc {
							found = true
							break
						}
					}
					if !found {
						course.AllowedCohorts = append(course.AllowedCohorts, rc)
						modified = true
					}
				}
				if modified {
					if _, err := s.UpdateCourse(course); err != nil {
						return SyncResult{}, fmt.Errorf("update course %s: %w", title, err)
					}
					courseMap[norm] = course
				}
			}

			for _, major := range majors {
				majorKey := major.Title
				if major.CohortYear != 0 {
					majorKey = fmt.Sprintf("%s (%d)", major.Title, major.CohortYear)
				}
				if _, exists := majorsByTitle[majorKey]; !exists {
					if existingID, ok := existingMajorByKey[majorKey]; ok {
						major.ID = existingID
					}
					if _, err := s.CreateMajor(major); err != nil {
						return SyncResult{}, fmt.Errorf("create major %s: %w", majorKey, err)
					}
					majorsByTitle[majorKey] = major
				}

				cur, ok := courseToMajorReqs[norm][majorKey]
				if !ok || cur.reqType != enums.RequirementTypeMajorCore {
					var mergedSpecs []string
					if ok {
						mergedSpecs = mergeStringSlices(cur.specializations, specs)
					} else {
						mergedSpecs = specs
					}
					courseToMajorReqs[norm][majorKey] = reqInfo{
						reqType:         reqType,
						specializations: mergedSpecs,
					}
				}
			}
		}
	}

	lookupCoursesByID, err := s.GetAllCourses()
	if err != nil {
		return SyncResult{}, fmt.Errorf("get courses for dependency lookup: %w", err)
	}
	lookupCourseMap := make(map[string]interfaces.CourseData, len(lookupCoursesByID))
	for id, course := range lookupCoursesByID {
		lookupCourseMap[id.String()] = course
	}

	prereqGroupCounter := make(map[uuid.UUID]int) // per-course group counter
	courseLookup := buildCourseReferenceLookup(lookupCourseMap)

	for _, entry := range allRows {
		rawPrereqs := getFirst(
			entry.Row,
			"Пререквизиты",
			"Пререквезиты",
			"Пререквизиты ",
			"Пререквезиты ",
		)
		for _, group := range SplitPrerequisiteGroups(rawPrereqs) {
			var resolvedIDs []uuid.UUID
			for _, prereqTitle := range group {
				targets, exists := resolveCourseReferenceTargets(courseLookup, prereqTitle, entry.SheetYear)
				if !exists {
					fmt.Printf("MISSING PREREQUISITE: course '%s' requires '%s', but it wasn't found\n", entry.Course.Title, prereqTitle)
					continue
				}
				for _, target := range targets {
					resolvedIDs = append(resolvedIDs, target.ID)
				}
			}
			resolvedIDs = dedupeUUIDs(resolvedIDs)
			if len(resolvedIDs) == 0 {
				continue
			}

			groupNum := 0
			if len(resolvedIDs) > 1 {
				// This is an OR-alternative group; assign a group number >= 1
				prereqGroupCounter[entry.Course.ID]++
				groupNum = prereqGroupCounter[entry.Course.ID]
			}

			for _, targetID := range resolvedIDs {
				depID := uuid.New()
				depKey := entry.Course.ID.String() + "\x00" + targetID.String() + "\x00" + string(enums.DependencyTypePrerequisite)
				if existingID, ok := existingDepByPair[depKey]; ok {
					depID = existingID
				}
				if _, err := s.CreateCourseDependency(interfaces.CourseDependencyData{
					ID:               depID,
					CourseID:         entry.Course.ID,
					RequiredCourseID: targetID,
					DependencyType:   enums.DependencyTypePrerequisite,
					AlternativeGroup: groupNum,
				}); err != nil {
					return SyncResult{}, fmt.Errorf("create prereq dependency: %w", err)
				}
			}
		}

		coreqsStr := getFirst(
			entry.Row,
			"Кореквизиты",
			"Кореквизиты ",
			"Кореквизиты (двустороння связь, когда два курса должны читаться вместе)",
			"Кореквизиты (когда курс A нельзя брать без курса B в семестре, но курс B можно без курса A)",
			"Кореквизиты (когда курс A нельзя брать без курса B в семестре, но курс B можно без курса A)",
		)

		for _, coreqTitle := range SplitSheetTitles(coreqsStr) {
			target, exists := resolveCourseReference(courseLookup, coreqTitle, entry.SheetYear)
			if !exists {
				fmt.Printf("MISSING COREQUISITE: course '%s' requires '%s', but it wasn't found\n", entry.Course.Title, coreqTitle)
				continue
			}
			depID := uuid.New()
			depKey := entry.Course.ID.String() + "\x00" + target.ID.String() + "\x00" + string(enums.DependencyTypeCorequisite)
			if existingID, ok := existingDepByPair[depKey]; ok {
				depID = existingID
			}
			if _, err := s.CreateCourseDependency(interfaces.CourseDependencyData{
				ID:               depID,
				CourseID:         entry.Course.ID,
				RequiredCourseID: target.ID,
				DependencyType:   enums.DependencyTypeCorequisite,
			}); err != nil {
				return SyncResult{}, fmt.Errorf("create coreq dependency: %w", err)
			}
		}
	}

	reqCount := 0
	createdSpecs := make(map[string]uuid.UUID)
	for normTitle, majorReqs := range courseToMajorReqs {
		course, ok := courseMap[normTitle]
		if !ok {
			slog.Warn("course mapping missing for major requirement", "title", normTitle)
			continue
		}
		for majorTitle, req := range majorReqs {
			major, exists := majorsByTitle[majorTitle]
			if !exists {
				continue
			}

			for _, specTitle := range req.specializations {
				specKey := major.ID.String() + "|" + specTitle
				if _, ok := createdSpecs[specKey]; !ok {
					newSpec, err := s.CreateSpecialization(interfaces.SpecializationData{
						ID:      uuid.New(),
						MajorID: major.ID,
						Title:   specTitle,
					})
					if err == nil {
						createdSpecs[specKey] = newSpec.ID
					}
				}
			}

			reqID := uuid.New()
			reqKey := major.ID.String() + "\x00" + course.ID.String()
			if existingID, ok := existingReqByPair[reqKey]; ok {
				reqID = existingID
			}
			if _, err := s.CreateMajorRequirement(interfaces.MajorRequirementData{
				ID:              reqID,
				MajorID:         major.ID,
				CourseID:        course.ID,
				RequirementType: req.reqType,
				Specializations: req.specializations,
			}); err != nil {
				return SyncResult{}, fmt.Errorf("create major requirement: %w", err)
			}
			reqCount++
		}
	}

	return SyncResult{
		Courses:           len(courseMap),
		Majors:            len(majorsByTitle),
		MajorRequirements: reqCount,
	}, nil
}

func syncWithSheets(s interfaces.StoreBase) error {
	if sheetsCfg.SpreadsheetID == "" || sheetsCfg.CredentialsJSON == "" {
		slog.Warn("Google Sheets not configured, skipping sync")
		return nil
	}

	config, err := google.JWTConfigFromJSON([]byte(sheetsCfg.CredentialsJSON), "https://www.googleapis.com/auth/spreadsheets.readonly")
	if err != nil {
		return fmt.Errorf("parse service account credentials: %w", err)
	}

	client := config.Client(context.Background())
	sheetsService, err := sheets.NewService(context.Background(), option.WithHTTPClient(client))
	if err != nil {
		return fmt.Errorf("create sheets service: %w", err)
	}

	spreadsheet, err := sheetsService.Spreadsheets.Get(sheetsCfg.SpreadsheetID).Do()
	if err != nil {
		return fmt.Errorf("get spreadsheet metadata: %w", err)
	}

	sheetMapping := make(map[string]SheetMajorMapping)
	sheetNames := make([]string, 0, len(spreadsheet.Sheets))
	for _, sheet := range spreadsheet.Sheets {
		title := sheet.Properties.Title
		sheetNames = append(sheetNames, title)
		if mapping, ok := guessSheetMapping(title); ok {
			sheetMapping[title] = mapping
			slog.Info(
				"sheet mapped",
				"sheet", title,
				"major", mapping.MajorTitle,
				"school", mapping.School,
				"category", mapping.Category,
				"source", "guess",
			)
		} else {
			slog.Warn(
				"sheet could not be mapped to any major",
				"sheet", title,
			)
		}
	}

	usedFilter := ""
	requestedSheets := sheetsCfg.SheetNames
	if len(requestedSheets) > 0 && requestedSheets[0] != "" {
		norm := func(v string) string {
			v = strings.ToLower(strings.TrimSpace(v))
			v = strings.Join(strings.Fields(v), " ")
			return v
		}
		wanted := make([]string, 0, len(requestedSheets))
		for _, rs := range requestedSheets {
			if n := norm(rs); n != "" {
				wanted = append(wanted, n)
			}
		}
		var filteredNames []string
		for _, sn := range sheetNames {
			snNorm := norm(sn)
			for _, w := range wanted {
				if strings.Contains(snNorm, w) {
					filteredNames = append(filteredNames, sn)
					break
				}
			}
		}
		sheetNames = filteredNames
		usedFilter = fmt.Sprintf(" (filtered from config, %d requested)", len(requestedSheets))
	}

	slog.Info(
		"discovered sheets for sync",
		"total_sheets", len(spreadsheet.Sheets),
		"mapped_sheets", len(sheetMapping),
		"to_sync", len(sheetNames),
		"sheets", sheetNames,
		"filter", usedFilter,
	)

	allData := make(map[string][]map[string]string)
	for _, sheetName := range sheetNames {
		slog.Info("fetching sheet", "sheet", sheetName)
		rangeStr := fmt.Sprintf("'%s'!A:Z", strings.ReplaceAll(sheetName, "'", "\\'"))
		resp, err := sheetsService.Spreadsheets.Values.Get(sheetsCfg.SpreadsheetID, rangeStr).Do()
		if err != nil {
			slog.Warn("failed to fetch sheet, skipping", "sheet", sheetName, "error", err)
			continue
		}

		if len(resp.Values) == 0 {
			continue
		}

		headerRaw := resp.Values[0]
		headers := make([]string, len(headerRaw))
		for i, h := range headerRaw {
			headers[i] = fmt.Sprint(h)
		}

		var rows []map[string]string
		for _, row := range resp.Values[1:] {
			record := make(map[string]string)
			for i, h := range headers {
				if i < len(row) {
					record[h] = fmt.Sprint(row[i])
				}
			}
			rows = append(rows, record)
		}
		allData[sheetName] = rows
		slog.Info("fetched rows from sheet", "sheet", sheetName, "count", len(rows))
	}

	if len(allData) == 0 {
		slog.Info("no data returned from Google Sheets")
		return nil
	}

	result, err := SyncFromSheetData(s, allData, sheetMapping)
	if err != nil {
		return fmt.Errorf("sync from sheet data: %w", err)
	}

	slog.Info(
		"Google Sheets sync complete",
		"courses", result.Courses,
		"majors", result.Majors,
		"major_requirements", result.MajorRequirements,
	)

	return nil
}

func NormalizeSheetTitle(raw string) string {
	s := strings.TrimSpace(trimLeadingCourseMarkers(strings.ReplaceAll(raw, "\u00a0", " ")))
	s = strings.Join(strings.Fields(s), " ")
	// Prefer Cyrillic lookalikes for a few common gremlins.
	s = strings.ReplaceAll(s, "C++", "С++")
	return s
}

type courseReferenceLookup struct {
	exactByYear map[int]map[string][]interfaces.CourseData
	aliasByYear map[int]map[string][]interfaces.CourseData
	exactGlobal map[string][]interfaces.CourseData
	aliasGlobal map[string][]interfaces.CourseData
	allCourses  []interfaces.CourseData
}

var titleParentheticalRegexp = regexp.MustCompile(`\([^)]*\)`)

var courseReferenceCanonicalReplacer = strings.NewReplacer(
	"\u00a0", " ",
	"ё", "е",
	"Ё", "Е",
	"&", " и ",
	"/", " / ",
	"-", " ",
	"–", " ",
	"—", " ",
	"−", " ",
	",", " ",
	";", " ",
	":", " ",
	".", " ",
	"«", " ",
	"»", " ",
	"\"", " ",
	"'", " ",
	"`", " ",
)

var humanReadableTitleAliases = map[string][]string{
	"язык программирования python":                     {"разработка на python"},
	"основы статистики":                                {"введение в статистику"},
	"алгоритмы и структуры данных":                     {"введение в алгоритмы и структуры данных", "введение в алгоритмы и сд"},
	"математическая статистика":                        {"теория вероятностей и математическая статистика"},
	"теория веростяностей и математическая статистика": {"теория вероятностей и математическая статистика"},
	"введение в искусственный интеллект":               {"введение в ии"},
	"введение в ии":                                    {"введение в искусственный интеллект"},
	"машинное обучение":                                {"машинное обучение (ml)"},
}

func trimLeadingCourseMarkers(raw string) string {
	return strings.TrimLeftFunc(raw, func(r rune) bool {
		return unicode.IsSpace(r) || r == '\uFE0F' || unicode.In(r, unicode.So, unicode.Sk, unicode.Sm)
	})
}

func canonicalizeCourseReferenceTitle(raw string) string {
	raw = NormalizeSheetTitle(raw)
	raw = courseReferenceCanonicalReplacer.Replace(raw)
	raw = strings.ToLower(raw)
	raw = strings.Join(strings.Fields(raw), " ")
	return raw
}

func exactCourseReferenceTitle(raw string) string {
	raw = strings.ReplaceAll(raw, "\u00a0", " ")
	raw = strings.ReplaceAll(raw, "\uFE0F", "")
	raw = strings.ReplaceAll(raw, "C++", "С++")
	raw = strings.ReplaceAll(raw, "ё", "е")
	raw = strings.ReplaceAll(raw, "Ё", "Е")
	raw = strings.ToLower(strings.Join(strings.Fields(strings.TrimSpace(raw)), " "))
	return raw
}

func titleAliasVariants(raw string) []string {
	seen := make(map[string]struct{})
	queue := []string{
		canonicalizeCourseReferenceTitle(raw),
		canonicalizeCourseReferenceTitle(titleParentheticalRegexp.ReplaceAllString(raw, " ")),
	}

	for i := 0; i < len(queue); i++ {
		candidate := strings.TrimSpace(queue[i])
		if candidate == "" {
			continue
		}
		if _, ok := seen[candidate]; ok {
			continue
		}
		seen[candidate] = struct{}{}
		for _, alias := range humanReadableTitleAliases[candidate] {
			queue = append(queue, canonicalizeCourseReferenceTitle(alias))
		}
		if strings.Contains(candidate, "глубокое обучение") {
			queue = append(queue, "глубокое обучение")
		}
	}

	variants := make([]string, 0, len(seen))
	for candidate := range seen {
		variants = append(variants, candidate)
	}
	sort.Strings(variants)
	return variants
}

func buildCourseReferenceLookup(courseMap map[string]interfaces.CourseData) courseReferenceLookup {
	lookup := courseReferenceLookup{
		exactByYear: make(map[int]map[string][]interfaces.CourseData),
		aliasByYear: make(map[int]map[string][]interfaces.CourseData),
		exactGlobal: make(map[string][]interfaces.CourseData),
		aliasGlobal: make(map[string][]interfaces.CourseData),
	}

	register := func(year int, target map[int]map[string][]interfaces.CourseData, global map[string][]interfaces.CourseData, key string, course interfaces.CourseData) {
		if key == "" {
			return
		}
		if target[year] == nil {
			target[year] = make(map[string][]interfaces.CourseData)
		}
		target[year][key] = appendUniqueCourseRef(target[year][key], course)
		global[key] = appendUniqueCourseRef(global[key], course)
	}

	for _, course := range courseMap {
		lookup.allCourses = appendUniqueCourseRef(lookup.allCourses, course)
		exactKey := exactCourseReferenceTitle(course.Title)
		aliases := titleAliasVariants(course.Title)
		if len(course.AllowedCohorts) == 0 {
			register(0, lookup.exactByYear, lookup.exactGlobal, exactKey, course)
			for _, alias := range aliases {
				register(0, lookup.aliasByYear, lookup.aliasGlobal, alias, course)
			}
			continue
		}
		for _, year := range course.AllowedCohorts {
			register(year, lookup.exactByYear, lookup.exactGlobal, exactKey, course)
			for _, alias := range aliases {
				register(year, lookup.aliasByYear, lookup.aliasGlobal, alias, course)
			}
		}
	}

	return lookup
}

func appendUniqueCourseRef(list []interfaces.CourseData, course interfaces.CourseData) []interfaces.CourseData {
	for _, existing := range list {
		if existing.ID == course.ID {
			return list
		}
	}
	return append(list, course)
}

func resolveCourseReferenceTargets(lookup courseReferenceLookup, rawTitle string, year int) ([]interfaces.CourseData, bool) {
	exactVariants := []string{exactCourseReferenceTitle(rawTitle)}
	for _, variant := range exactVariants {
		if targets, ok := resolveCourseReferenceCandidates(lookup.exactByYear[year][variant], rawTitle, false); ok {
			return targets, true
		}
	}
	for _, variant := range exactVariants {
		if targets, ok := resolveCourseReferenceCandidates(lookup.exactByYear[0][variant], rawTitle, false); ok {
			return targets, true
		}
	}
	for _, variant := range exactVariants {
		if targets, ok := resolveCourseReferenceCandidates(lookup.exactGlobal[variant], rawTitle, false); ok {
			return targets, true
		}
	}

	variants := titleAliasVariants(rawTitle)
	for _, variant := range variants {
		if targets, ok := resolveCourseReferenceCandidates(lookup.aliasByYear[year][variant], rawTitle, true); ok {
			return targets, true
		}
	}
	for _, variant := range variants {
		if targets, ok := resolveCourseReferenceCandidates(lookup.aliasByYear[0][variant], rawTitle, true); ok {
			return targets, true
		}
	}
	for _, variant := range variants {
		if targets, ok := resolveCourseReferenceCandidates(lookup.aliasGlobal[variant], rawTitle, true); ok {
			return targets, true
		}
	}
	if targets, ok := resolveCourseReferenceByScan(lookup.allCourses, rawTitle, year); ok {
		return targets, true
	}
	return nil, false
}

func resolveCourseReferenceByScan(courses []interfaces.CourseData, rawTitle string, year int) ([]interfaces.CourseData, bool) {
	exactKey := exactCourseReferenceTitle(rawTitle)
	aliasVariants := titleAliasVariants(rawTitle)
	aliasSet := make(map[string]struct{}, len(aliasVariants))
	for _, variant := range aliasVariants {
		aliasSet[variant] = struct{}{}
	}

	exactMatches := make([]interfaces.CourseData, 0)
	aliasMatches := make([]interfaces.CourseData, 0)
	for _, course := range courses {
		if year != 0 && len(course.AllowedCohorts) > 0 && !containsInt(course.AllowedCohorts, year) {
			continue
		}
		if exactCourseReferenceTitle(course.Title) == exactKey {
			exactMatches = appendUniqueCourseRef(exactMatches, course)
			continue
		}
		for _, variant := range titleAliasVariants(course.Title) {
			if _, ok := aliasSet[variant]; ok {
				aliasMatches = appendUniqueCourseRef(aliasMatches, course)
				break
			}
		}
	}

	if targets, ok := resolveCourseReferenceCandidates(exactMatches, rawTitle, false); ok {
		return targets, true
	}
	if targets, ok := resolveCourseReferenceCandidates(aliasMatches, rawTitle, true); ok {
		return targets, true
	}
	return nil, false
}

func containsInt(values []int, target int) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}

func resolveCourseReference(lookup courseReferenceLookup, rawTitle string, year int) (interfaces.CourseData, bool) {
	targets, ok := resolveCourseReferenceTargets(lookup, rawTitle, year)
	if !ok || len(targets) != 1 {
		return interfaces.CourseData{}, false
	}
	return targets[0], true
}

func resolveCourseReferenceCandidates(candidates []interfaces.CourseData, rawTitle string, allowAnalogAlternatives bool) ([]interfaces.CourseData, bool) {
	if len(candidates) == 0 {
		return nil, false
	}
	if len(candidates) == 1 {
		return candidates, true
	}

	exactKey := exactCourseReferenceTitle(rawTitle)
	for _, candidate := range candidates {
		if exactCourseReferenceTitle(candidate.Title) == exactKey {
			return []interfaces.CourseData{candidate}, true
		}
	}

	if allowAnalogAlternatives && (candidatesShareAnalogGroup(candidates) || candidatesShareCanonicalTitle(candidates)) {
		return candidates, true
	}

	preferred, ok := pickPreferredCourseReference(candidates)
	if !ok {
		return nil, false
	}
	return []interfaces.CourseData{preferred}, true
}

func candidatesShareAnalogGroup(candidates []interfaces.CourseData) bool {
	if len(candidates) == 0 {
		return false
	}
	group := strings.TrimSpace(candidates[0].AnalogGroup)
	if group == "" {
		return false
	}
	for _, candidate := range candidates[1:] {
		if !strings.EqualFold(strings.TrimSpace(candidate.AnalogGroup), group) {
			return false
		}
	}
	return true
}

func candidatesShareCanonicalTitle(candidates []interfaces.CourseData) bool {
	if len(candidates) == 0 {
		return false
	}
	canonical := canonicalizeCourseReferenceTitle(candidates[0].Title)
	if canonical == "" {
		return false
	}
	for _, candidate := range candidates[1:] {
		if canonicalizeCourseReferenceTitle(candidate.Title) != canonical {
			return false
		}
	}
	return true
}

func pickPreferredCourseReference(candidates []interfaces.CourseData) (interfaces.CourseData, bool) {
	if len(candidates) == 0 {
		return interfaces.CourseData{}, false
	}
	sorted := append([]interfaces.CourseData{}, candidates...)
	sort.Slice(sorted, func(i, j int) bool {
		scoreI := courseReferencePreferenceScore(sorted[i])
		scoreJ := courseReferencePreferenceScore(sorted[j])
		if scoreI == scoreJ {
			return sorted[i].Title < sorted[j].Title
		}
		return scoreI > scoreJ
	})
	return sorted[0], true
}

func courseReferencePreferenceScore(course interfaces.CourseData) int {
	title := strings.ToLower(course.Title)
	score := 0
	if course.CourseType == enums.CourseTypeMandatory {
		score += 200
	}
	if strings.Contains(title, "🔴") {
		score += 150
	}
	if strings.Contains(title, "🔵") {
		score += 100
	}
	if !strings.Contains(title, "продвинут") && !strings.Contains(title, "advanced") {
		score += 50
	}
	if strings.Contains(title, "⚫") {
		score -= 25
	}
	return score
}

func dedupeUUIDs(ids []uuid.UUID) []uuid.UUID {
	seen := make(map[uuid.UUID]bool, len(ids))
	out := make([]uuid.UUID, 0, len(ids))
	for _, id := range ids {
		if seen[id] {
			continue
		}
		seen[id] = true
		out = append(out, id)
	}
	return out
}

func SplitSheetTitles(raw string) []string {
	if raw == "" {
		return nil
	}
	raw = strings.TrimSpace(raw)
	if raw == "" || raw == "-" {
		return nil
	}
	if strings.EqualFold(raw, "нет") {
		return nil
	}
	var out []string
	for _, part := range strings.FieldsFunc(raw, func(r rune) bool {
		return r == ',' || r == '\n' || r == ';'
	}) {
		part = strings.Join(strings.Fields(part), " ")
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}

func normalizeSheetHeader(raw string) string {
	raw = strings.TrimSpace(raw)
	raw = strings.ToLower(raw)
	return strings.Join(strings.Fields(raw), " ")
}

func getFirst(row map[string]string, keys ...string) string {
	normalizedKeys := make([]string, 0, len(keys))
	for _, k := range keys {
		normalizedKeys = append(normalizedKeys, normalizeSheetHeader(k))
	}

	for _, k := range keys {
		if v := strings.TrimSpace(row[k]); v != "" {
			return v
		}
	}

	for k, v := range row {
		normalizedKey := normalizeSheetHeader(k)
		for _, want := range normalizedKeys {
			if normalizedKey == want {
				if trimmed := strings.TrimSpace(v); trimmed != "" {
					return trimmed
				}
			}
		}
	}
	return ""
}

var (
	AllowedCohortsRegexp = regexp.MustCompile(`^(\d{4})\s*[-–]\s*(\d{4})$`)
	YearRegexp           = regexp.MustCompile(`\b(20\d{2})\b`)
)

func parseAllowedCohorts(raw string) []int {
	if raw == "" {
		return nil
	}
	raw = strings.TrimSpace(raw)
	raw = strings.Trim(raw, "\"")
	raw = strings.ReplaceAll(raw, "/", ",")

	seen := make(map[int]bool)
	var result []int

	for _, part := range strings.Split(raw, ",") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		if matches := AllowedCohortsRegexp.FindStringSubmatch(part); len(matches) == 3 {
			start, _ := strconv.Atoi(matches[1])
			if start > 0 {
				if !seen[start] {
					seen[start] = true
					result = append(result, start)
				}
			}
		} else {
			matches := YearRegexp.FindAllString(part, -1)
			for _, m := range matches {
				if year, err := strconv.Atoi(m); err == nil {
					if !seen[year] {
						seen[year] = true
						result = append(result, year)
					}
				}
			}
		}
	}

	sort.Ints(result)
	return result
}

var (
	RecommendedSemesterRegexp = regexp.MustCompile(`\d+`)
	WorkloadRegexp            = regexp.MustCompile(`(\d+(?:\.\d+)?)`)
)

func MapSheetRowToCourse(row map[string]string, category enums.CourseCategory) interfaces.CourseData {
	rawType := strings.ToLower(getFirst(row, "Тип курса"))
	var courseType enums.CourseType
	if category == enums.CourseCategoryFundamentals {
		if strings.Contains(rawType, "факультатив") || strings.Contains(rawType, "elective") {
			courseType = enums.CourseTypeElective
		} else if strings.Contains(rawType, "общеуниверситетский") || strings.Contains(rawType, "универ") {
			courseType = enums.CourseTypeOther
		} else if strings.Contains(rawType, "core") || strings.Contains(rawType, "mandatory") {
			courseType = enums.CourseTypeMandatory
		} else {
			courseType = enums.CourseTypeOther
		}
	} else if strings.Contains(rawType, "core") || strings.Contains(rawType, "mandatory") {
		courseType = enums.CourseTypeMandatory
	} else if strings.Contains(rawType, "choice") || strings.Contains(rawType, "elective") || strings.Contains(rawType, "факультатив") {
		courseType = enums.CourseTypeElective
	} else {
		courseType = enums.CourseTypeOther
	}

	rawSeason := strings.ToLower(getFirst(row, "Осень / весна"))
	var availableSemesters []int
	if strings.Contains(rawSeason, "осень") {
		availableSemesters = []int{1, 3, 5, 7}
	} else if strings.Contains(rawSeason, "весна") {
		availableSemesters = []int{2, 4, 6, 8}
	} else {
		availableSemesters = []int{1, 2, 3, 4, 5, 6, 7, 8}
	}

	exclusiveSemesterRaw := getFirst(row, "Исключительный семестр", "Исключительный семестр ")
	if exclusiveSemesterRaw != "" {
		if match := RecommendedSemesterRegexp.FindString(exclusiveSemesterRaw); match != "" {
			v := 0
			_, err := fmt.Sscanf(match, "%d", &v)
			if err == nil {
				availableSemesters = []int{v}
			}
		}
	}

	var recommendedSemester *int
	rawRec := getFirst(row, "Рекомендованный к прохождению семестр", "Семестр")
	if match := RecommendedSemesterRegexp.FindString(rawRec); match != "" {
		v := 0
		_, err := fmt.Sscanf(match, "%d", &v)
		if err != nil {
			return interfaces.CourseData{}
		}
		recommendedSemester = &v
	}

	workload := 1.0

	cd := interfaces.CourseData{
		ID:                  uuid.New(),
		Title:               strings.TrimSpace(getFirst(row, "Название курса")),
		Description:         new(getFirst(row, "Контекст", "Контекст, чтобы правильно отобразить на траектории\nесли есть")),
		HandbookLink:        new(getFirst(row, "Силлабус если есть", "Силлабус\nесли есть", "Силлабус")),
		CourseType:          courseType,
		Category:            category,
		AllowedCohorts:      parseAllowedCohorts(getFirst(row, "Поток")),
		AvailableSemesters:  availableSemesters,
		RecommendedSemester: recommendedSemester,
		Workload:            workload,
		AnalogGroup:         strings.TrimSpace(getFirst(row, "Группа аналогов(алгоритм не берет больше 1 курса из группы)", "Группа аналогов")),
	}

	return cd
}

// SplitPrerequisiteGroups splits a prerequisites string into groups of alternatives.
func SplitPrerequisiteGroups(raw string) [][]string {
	if raw == "" {
		return nil
	}
	raw = strings.TrimSpace(raw)
	if raw == "" || raw == "-" {
		return nil
	}
	if strings.EqualFold(raw, "нет") {
		return nil
	}
	var groups [][]string
	for _, part := range strings.FieldsFunc(raw, func(r rune) bool {
		return r == ',' || r == '\n' || r == ';'
	}) {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		// Check for "/" alternatives within the group
		alternatives := strings.Split(part, "/")
		var group []string
		for _, alt := range alternatives {
			alt = strings.TrimSpace(alt)
			if alt != "" {
				group = append(group, alt)
			}
		}
		if len(group) > 0 {
			groups = append(groups, group)
		}
	}
	return groups
}

func mergeStringSlices(a, b []string) []string {
	m := make(map[string]bool)
	for _, s := range a {
		m[s] = true
	}
	for _, s := range b {
		m[s] = true
	}
	var out []string
	for s := range m {
		out = append(out, s)
	}
	sort.Strings(out)
	return out
}
