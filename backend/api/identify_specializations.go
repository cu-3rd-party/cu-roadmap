package api

import (
	"encoding/json"
	"math"
	"net/http"
	"sort"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func identifySpecializations(c *gin.Context) {
	var rawMessage json.RawMessage
	if err := c.ShouldBindJSON(&rawMessage); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var passedIDs []string
	currentSemester := 1

	var majorIDFilter *uuid.UUID
	if err := json.Unmarshal(rawMessage, &passedIDs); err != nil {
		var req struct {
			PassedCourseIDs []string `json:"passed_course_ids"`
			CurrentSemester int      `json:"current_semester"`
			MajorID         string   `json:"major_id"`
		}
		if err2 := json.Unmarshal(rawMessage, &req); err2 != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
			return
		}
		passedIDs = req.PassedCourseIDs
		if len(passedIDs) == 0 {
			currentSemester = 1
		} else if req.CurrentSemester > 0 {
			currentSemester = req.CurrentSemester
		}
		if req.MajorID != "" {
			parsedMajorID, err := uuid.Parse(req.MajorID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid major_id"})
				return
			}
			majorIDFilter = &parsedMajorID
		}
	}

	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	majors, err := s.GetAllMajors()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	cohortYear, ok := parseOptionalCohortYear(c)
	if !ok {
		return
	}

	passedUUIDs := make(map[uuid.UUID]bool)
	for _, pid := range passedIDs {
		uid, err := uuid.Parse(pid)
		if err == nil {
			passedUUIDs[uid] = true
		}
	}

	coursesByID, err := s.GetAllCourses()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	deps, _ := s.GetCourseDependencies()
	prereqGroups := make(map[uuid.UUID]map[int][]uuid.UUID)
	coreqMap := make(map[uuid.UUID][]uuid.UUID)
	for _, d := range deps {
		if d.DependencyType == enums.DependencyTypePrerequisite {
			if prereqGroups[d.CourseID] == nil {
				prereqGroups[d.CourseID] = make(map[int][]uuid.UUID)
			}
			prereqGroups[d.CourseID][d.AlternativeGroup] = append(prereqGroups[d.CourseID][d.AlternativeGroup], d.RequiredCourseID)
		} else if d.DependencyType == enums.DependencyTypeCorequisite {
			coreqMap[d.CourseID] = append(coreqMap[d.CourseID], d.RequiredCourseID)
		}
	}

	hasEquivalentPrerequisiteRelation := func(courseID, requiredCourseID uuid.UUID) bool {
		for _, group := range prereqGroups[courseID] {
			for _, id := range group {
				if id == requiredCourseID {
					return true
				}
			}
		}
		return false
	}

	earliestMemo := make(map[uuid.UUID]int)
	var earliestCompletionSemester func(id uuid.UUID, visited map[uuid.UUID]bool) int
	earliestCompletionSemester = func(id uuid.UUID, visited map[uuid.UUID]bool) int {
		if passedUUIDs[id] {
			return 0
		}
		if sem, ok := earliestMemo[id]; ok {
			return sem
		}
		if visited[id] {
			return math.MaxInt32
		}
		course, ok := coursesByID[id]
		if !ok {
			return math.MaxInt32
		}
		if cohortYear != 0 && len(course.AllowedCohorts) > 0 && !cohortInSlice(cohortYear, course.AllowedCohorts) {
			return math.MaxInt32
		}

		visited[id] = true
		readySemester := 1
		// Earlier semesters are treated as closed only when there is already some content there.
		// If the first/second semester are still empty, they remain available for planning.
		hasEarlierSemesterContent := len(passedUUIDs) > 0
		if currentSemester > 1 && hasEarlierSemesterContent {
			readySemester = currentSemester
		}

		for groupNum, group := range prereqGroups[id] {
			if groupNum == 0 {
				for _, pid := range group {
					prereqSem := earliestCompletionSemester(pid, visited)
					if prereqSem == math.MaxInt32 {
						visited[id] = false
						return math.MaxInt32
					}
					if prereqSem+1 > readySemester {
						readySemester = prereqSem + 1
					}
				}
			} else {
				minGroupReadySem := math.MaxInt32
				for _, pid := range group {
					prereqSem := earliestCompletionSemester(pid, visited)
					if prereqSem != math.MaxInt32 {
						if prereqSem+1 < minGroupReadySem {
							minGroupReadySem = prereqSem + 1
						}
					}
				}
				if minGroupReadySem == math.MaxInt32 {
					visited[id] = false
					return math.MaxInt32
				}
				if minGroupReadySem > readySemester {
					readySemester = minGroupReadySem
				}
			}
		}

		for _, pid := range coreqMap[id] {
			coreqSem := earliestCompletionSemester(pid, visited)
			if coreqSem == math.MaxInt32 {
				visited[id] = false
				return math.MaxInt32
			}
			if coreqSem > readySemester {
				if hasEquivalentPrerequisiteRelation(id, pid) {
					readySemester = coreqSem
				} else {
					readySemester = coreqSem
				}
			}
		}

		visited[id] = false
		for sem := readySemester; sem <= 8; sem++ {
			if offeredInSemester(course, sem) {
				earliestMemo[id] = sem
				return sem
			}
		}
		return math.MaxInt32
	}

	buildCourseStatusDetails := func(courseIDs map[uuid.UUID]bool) ([]gin.H, []gin.H, []gin.H) {
		ids := make([]uuid.UUID, 0, len(courseIDs))
		for id := range courseIDs {
			ids = append(ids, id)
		}
		sort.Slice(ids, func(i, j int) bool {
			return ids[i].String() < ids[j].String()
		})

		coveredCourses := make([]gin.H, 0)
		canCoverCourses := make([]gin.H, 0)
		cannotCoverCourses := make([]gin.H, 0)
		for _, id := range ids {
			course, ok := coursesByID[id]
			courseTitle := ""
			if ok {
				courseTitle = course.Title
			}

			if passedUUIDs[id] {
				coveredCourses = append(coveredCourses, gin.H{
					"course_id": id.String(),
					"title":     courseTitle,
				})
				continue
			}

			earliestSemester := earliestCompletionSemester(id, make(map[uuid.UUID]bool))
			if earliestSemester <= 8 {
				canCoverCourses = append(canCoverCourses, gin.H{
					"course_id": id.String(),
					"title":     courseTitle,
				})
			} else {
				cannotCoverCourses = append(cannotCoverCourses, gin.H{
					"course_id": id.String(),
					"title":     courseTitle,
				})
			}
		}
		return coveredCourses, canCoverCourses, cannotCoverCourses
	}

	appendUniqueCourseID := func(ids []uuid.UUID, seen map[uuid.UUID]bool, id uuid.UUID) []uuid.UUID {
		if seen[id] {
			return ids
		}
		seen[id] = true
		return append(ids, id)
	}

	buildRequirementGroups := func(orderedIDs []uuid.UUID) []map[uuid.UUID]bool {
		requirementGroups := []map[uuid.UUID]bool{}
		analogGroupToGroupIndex := make(map[string]int)
		for _, id := range orderedIDs {
			course, ok := coursesByID[id]
			if ok && course.AnalogGroup != "" {
				if idx, exists := analogGroupToGroupIndex[course.AnalogGroup]; exists {
					requirementGroups[idx][id] = true
					continue
				}
			}

			idx := len(requirementGroups)
			if ok && course.AnalogGroup != "" {
				analogGroupToGroupIndex[course.AnalogGroup] = idx
			}
			requirementGroups = append(requirementGroups, map[uuid.UUID]bool{id: true})
		}
		return requirementGroups
	}

	analysis := []gin.H{}
	appendAnalysis := func(resultID, majorID uuid.UUID, title string, cohortYear int, orderedReqIDs []uuid.UUID) {
		requirementGroups := buildRequirementGroups(orderedReqIDs)
		if len(requirementGroups) == 0 {
			return
		}

		covered := 0
		canCover := 0
		coveredCourses := make([]gin.H, 0)
		canCoverCourses := make([]gin.H, 0)
		cannotCoverCourses := make([]gin.H, 0)
		for _, group := range requirementGroups {
			groupCovered := false
			groupCanCover := false
			for id := range group {
				if passedUUIDs[id] {
					groupCovered = true
				} else {
					earliestSemester := earliestCompletionSemester(id, make(map[uuid.UUID]bool))
					if earliestSemester <= 8 {
						groupCanCover = true
					}
				}
			}
			if groupCovered {
				covered++
			}
			if groupCanCover {
				canCover++
			}
		}
		for _, group := range requirementGroups {
			groupCoveredCourses, groupCanCoverCourses, groupCannotCoverCourses := buildCourseStatusDetails(group)
			coveredCourses = append(coveredCourses, groupCoveredCourses...)
			canCoverCourses = append(canCoverCourses, groupCanCoverCourses...)
			cannotCoverCourses = append(cannotCoverCourses, groupCannotCoverCourses...)
		}

		analysis = append(analysis, gin.H{
			"id":                   resultID.String(),
			"major_id":             majorID.String(),
			"title":                title,
			"cohort_year":          cohortYear,
			"score":                float64(covered) / float64(len(requirementGroups)),
			"covered_count":        covered,
			"can_cover_count":      canCover,
			"total_count":          len(requirementGroups),
			"covered_courses":      coveredCourses,
			"can_cover_courses":    canCoverCourses,
			"cannot_cover_courses": cannotCoverCourses,
		})
	}

	for _, m := range majors {
		if majorIDFilter != nil && m.ID != *majorIDFilter {
			continue
		}
		if cohortYear != 0 && m.CohortYear != cohortYear {
			continue
		}
		reqs, err := s.GetMajorRequirements(m.ID)
		if err != nil {
			continue
		}
		specs, err := s.GetSpecializationsByMajor(m.ID)
		if err != nil {
			continue
		}

		orderedCoreReqIDs := make([]uuid.UUID, 0)
		coreReqIDsSeen := make(map[uuid.UUID]bool)
		orderedChoiceReqIDs := make([]uuid.UUID, 0)
		choiceReqIDsSeen := make(map[uuid.UUID]bool)
		for _, r := range reqs {
			switch r.RequirementType {
			case enums.RequirementTypeMajorCore:
				orderedCoreReqIDs = appendUniqueCourseID(orderedCoreReqIDs, coreReqIDsSeen, r.CourseID)
			case enums.RequirementTypeMajorChoice:
				orderedChoiceReqIDs = appendUniqueCourseID(orderedChoiceReqIDs, choiceReqIDsSeen, r.CourseID)
			}
		}

		if len(specs) == 0 {
			orderedReqIDs := append([]uuid.UUID{}, orderedCoreReqIDs...)
			orderedReqIDs = append(orderedReqIDs, orderedChoiceReqIDs...)
			appendAnalysis(m.ID, m.ID, m.Title, m.CohortYear, orderedReqIDs)
			continue
		}

		for _, spec := range specs {
			orderedReqIDs := append([]uuid.UUID{}, orderedCoreReqIDs...)
			reqIDsSeen := make(map[uuid.UUID]bool, len(orderedReqIDs))
			for _, id := range orderedReqIDs {
				reqIDsSeen[id] = true
			}
			for _, r := range reqs {
				if r.RequirementType != enums.RequirementTypeMajorChoice {
					continue
				}
				if len(r.Specializations) > 0 {
					for _, sTitle := range r.Specializations {
						if sTitle == spec.Title {
							orderedReqIDs = appendUniqueCourseID(orderedReqIDs, reqIDsSeen, r.CourseID)
							break
						}
					}
				}
			}

			appendAnalysis(spec.ID, m.ID, spec.Title, m.CohortYear, orderedReqIDs)
		}
	}

	for i := 0; i < len(analysis); i++ {
		for j := i + 1; j < len(analysis); j++ {
			if analysis[j]["score"].(float64) > analysis[i]["score"].(float64) {
				analysis[i], analysis[j] = analysis[j], analysis[i]
			}
		}
	}

	c.JSON(http.StatusOK, analysis)
}
