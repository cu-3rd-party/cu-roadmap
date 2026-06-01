package store

import (
	"context"
	"fmt"
	"log/slog"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
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

func majorTitleWithCohort(base string, cohorts []int) string {
	if len(cohorts) == 0 {
		return base
	}
	// One course row can list multiple cohorts; to keep store semantics simple
	// we use the earliest cohort as the major "track" discriminator.
	min := cohorts[0]
	for _, y := range cohorts[1:] {
		if y < min {
			min = y
		}
	}
	return fmt.Sprintf("%s (%d)", base, min)
}

func requirementTypeFromSheetCourseType(raw string) enums.RequirementType {
	raw = strings.ToLower(strings.TrimSpace(raw))
	if strings.Contains(raw, "core") || strings.Contains(raw, "общеуниверситет") {
		return enums.RequirementTypeCore
	}
	if strings.Contains(raw, "choice") || strings.Contains(raw, "flex") || strings.Contains(raw, "факультатив") {
		return enums.RequirementTypeMinorRecommended
	}
	return enums.RequirementTypeCore
}

var SheetToMajor = map[string]SheetMajorMapping{
	"Бизнес и аналитика":      {"Business", "Business", enums.CourseCategoryBusiness},
	"Искусственный интеллект": {"AI", "Tech", enums.CourseCategoryAI},
	"Разработка":              {"Software Engineering", "Tech", enums.CourseCategoryTech},
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
		{[]string{"бизнес", "business", "экономика", "финанс", "маркетинг", "аналитик"}, SheetMajorMapping{"Business", "Business", enums.CourseCategoryBusiness}},
		{[]string{"искусственный интеллект", "интеллект", "machine learning", "deep learning", "ml", "dl", "ai", "ии", "нейро"}, SheetMajorMapping{"AI", "Tech", enums.CourseCategoryAI}},
		{[]string{"разработка", "software", "программирован", "программист", "swe", "engineering", "development", "web", "mobile", "backend", "frontend"}, SheetMajorMapping{"Software Engineering", "Tech", enums.CourseCategoryTech}},
		{[]string{"дизайн", "design", "ux", "ui", "график"}, SheetMajorMapping{"Design", "Design", enums.CourseCategoryDesign}},
		{[]string{"общ", "common", "general", "fundamental", "базов", "основ"}, SheetMajorMapping{"Common", "Common", enums.CourseCategoryFundamentals}},
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

func SyncFromSheetData(s StoreBase, sheetsData map[string][]map[string]string, sheetMapping map[string]SheetMajorMapping) (SyncResult, error) {
	if err := s.ClearAll(); err != nil {
		return SyncResult{}, fmt.Errorf("clear store: %w", err)
	}

	majorsByTitle := make(map[string]MajorData)
	courseMap := make(map[string]CourseData)
	courseToMajorReqs := make(map[string]map[string]enums.RequirementType)
	type rowEntry struct {
		Row    map[string]string
		Course CourseData
	}
	var allRows []rowEntry

	for sheetName, rows := range sheetsData {
		mapping, ok := sheetMapping[sheetName]
		if !ok {
			slog.Warn("unknown sheet, skipping", "sheet", sheetName)
			continue
		}

		for _, row := range rows {
			title := strings.TrimSpace(getFirst(row, "Название курса"))
			if title == "" {
				continue
			}

			norm := NormalizeSheetTitle(title)
			cohorts := parseAllowedCohorts(getFirst(row, "Поток"))
			majorTitle := majorTitleWithCohort(mapping.MajorTitle, cohorts)
			if _, exists := majorsByTitle[majorTitle]; !exists {
				major := MajorData{ID: uuid.New(), Title: majorTitle, School: mapping.School}
				if _, err := s.CreateMajor(major); err != nil {
					return SyncResult{}, fmt.Errorf("create major %s: %w", majorTitle, err)
				}
				majorsByTitle[majorTitle] = major
			}

			reqType := requirementTypeFromSheetCourseType(getFirst(row, "Тип курса"))
			if _, exists := courseMap[norm]; !exists {
				course := MapSheetRowToCourse(row, mapping.Category)
				if _, err := s.CreateCourse(course); err != nil {
					return SyncResult{}, fmt.Errorf("create course %s: %w", title, err)
				}
				courseMap[norm] = course
				courseToMajorReqs[norm] = make(map[string]enums.RequirementType)
				allRows = append(allRows, rowEntry{Row: row, Course: course})
			}

			cur, ok := courseToMajorReqs[norm][majorTitle]
			if !ok || cur != enums.RequirementTypeCore {
				// core wins over minor_recommended if the course appears multiple times.
				courseToMajorReqs[norm][majorTitle] = reqType
			}
		}
	}

	for _, entry := range allRows {
		for _, prereqTitle := range SplitSheetTitles(getFirst(entry.Row, "Пререквизиты")) {
			norm := NormalizeSheetTitle(prereqTitle)
			target, exists := courseMap[norm]
			if !exists {
				target, exists = courseMap[prereqTitle]
				if !exists {
					continue
				}
			}
			if _, err := s.CreateCourseDependency(CourseDependencyData{
				ID:               uuid.New(),
				CourseID:         entry.Course.ID,
				RequiredCourseID: target.ID,
				DependencyType:   enums.DependencyTypePrerequisite,
			}); err != nil {
				return SyncResult{}, fmt.Errorf("create prereq dependency: %w", err)
			}
		}

		for _, coreqTitle := range SplitSheetTitles(getFirst(
			entry.Row,
			"Кореквизиты",
			"Кореквизиты ",
			"Кореквизиты (двустороння связь, когда два курса должны читаться вместе)",
			"Кореквизиты (когда курс A нельзя брать без курса B в семестре, но курс B можно без курса A)",
			"Кореквизиты (когда курс A нельзя брать без курса B в семестре, но курс B можно без курса A)",
		)) {
			norm := NormalizeSheetTitle(coreqTitle)
			target, exists := courseMap[norm]
			if !exists {
				target, exists = courseMap[coreqTitle]
				if !exists {
					continue
				}
			}
			if _, err := s.CreateCourseDependency(CourseDependencyData{
				ID:               uuid.New(),
				CourseID:         entry.Course.ID,
				RequiredCourseID: target.ID,
				DependencyType:   enums.DependencyTypeCorequisite,
			}); err != nil {
				return SyncResult{}, fmt.Errorf("create coreq dependency: %w", err)
			}
		}
	}

	reqCount := 0
	for normTitle, majorReqs := range courseToMajorReqs {
		course := courseMap[normTitle]
		for majorTitle, reqType := range majorReqs {
			major, exists := majorsByTitle[majorTitle]
			if !exists {
				continue
			}
			if _, err := s.CreateMajorRequirement(MajorRequirementData{
				ID:              uuid.New(),
				MajorID:         major.ID,
				CourseID:        course.ID,
				RequirementType: reqType,
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

func syncWithSheets(s StoreBase) error {
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

var NormalizeSheetTileRegexp = regexp.MustCompile("^[\u2600-\u27BF\U0001F300-\U0001F64F\U0001F680-\U0001F6FF\U0001F534\U0001F535\u26AB]\\s*")

func NormalizeSheetTitle(raw string) string {
	s := strings.TrimSpace(NormalizeSheetTileRegexp.ReplaceAllString(raw, ""))
	// Prefer Cyrillic lookalikes for a few common gremlins.
	s = strings.ReplaceAll(s, "C++", "С++")
	return s
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
		part = strings.TrimSpace(part)
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}

func getFirst(row map[string]string, keys ...string) string {
	for _, k := range keys {
		if v := strings.TrimSpace(row[k]); v != "" {
			return NormalizeSheetTitle(v)
		}
	}
	return ""
}

var AllowedCohortsRegexp = regexp.MustCompile(`^(\d{4})\s*[-–]\s*(\d{4})$`)

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
			end, _ := strconv.Atoi(matches[2])
			if start > 0 && end > 0 && start <= end {
				for y := start; y <= end; y++ {
					if !seen[y] {
						seen[y] = true
						result = append(result, y)
					}
				}
			}
		} else if year, err := strconv.Atoi(part); err == nil {
			if !seen[year] {
				seen[year] = true
				result = append(result, year)
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

func MapSheetRowToCourse(row map[string]string, category enums.CourseCategory) CourseData {
	rawType := strings.ToLower(getFirst(row, "Тип курса"))
	var courseType enums.CourseType
	if strings.Contains(rawType, "core") || strings.Contains(rawType, "mandatory") {
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

	var recommendedSemester *int
	rawRec := getFirst(row, "Рекомендованный к прохождению семестр", "Семестр")
	if match := RecommendedSemesterRegexp.FindString(rawRec); match != "" {
		v := 0
		fmt.Sscanf(match, "%d", &v)
		recommendedSemester = &v
	}

	rawWorkload := getFirst(row, "Нагрузка", "workload")
	if rawWorkload == "" {
		rawWorkload = "5"
	}
	workload := 5.0
	if match := WorkloadRegexp.FindString(rawWorkload); match != "" {
		fmt.Sscanf(match, "%f", &workload)
	}

	return CourseData{
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
	}
}
