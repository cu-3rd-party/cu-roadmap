package api

import (
	"encoding/json"
	"math"
	"net/http"

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
		if req.CurrentSemester > 0 {
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
	for _, d := range deps {
		if d.DependencyType == enums.DependencyTypePrerequisite {
			if prereqGroups[d.CourseID] == nil {
				prereqGroups[d.CourseID] = make(map[int][]uuid.UUID)
			}
			prereqGroups[d.CourseID][d.AlternativeGroup] = append(prereqGroups[d.CourseID][d.AlternativeGroup], d.RequiredCourseID)
		}
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
		readySemester := currentSemester

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

		visited[id] = false
		for sem := readySemester; sem <= 8; sem++ {
			if offeredInSemester(course, sem) {
				earliestMemo[id] = sem
				return sem
			}
		}
		return math.MaxInt32
	}

	analysis := []gin.H{}
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

		coreReqIDs := make(map[uuid.UUID]bool)

		if len(specs) == 0 {
			reqIDs := make(map[uuid.UUID]bool)
			for _, r := range reqs {
				if r.RequirementType == enums.RequirementTypeMajorChoice {
					reqIDs[r.CourseID] = true
				}
			}
			if len(reqIDs) == 0 {
				continue
			}
			covered := 0
			canCover := 0
			for id := range reqIDs {
				if passedUUIDs[id] {
					covered++
				} else {
					earliestSemester := earliestCompletionSemester(id, make(map[uuid.UUID]bool))
					if earliestSemester <= 8 {
						canCover++
					}
				}
			}
			score := float64(covered) / float64(len(reqIDs))
			analysis = append(analysis, gin.H{
				"id":              m.ID.String(),
				"major_id":        m.ID.String(),
				"title":           m.Title,
				"cohort_year":     m.CohortYear,
				"score":           score,
				"covered_count":   covered,
				"can_cover_count": canCover,
				"total_count":     len(reqIDs),
			})
			continue
		}

		for _, spec := range specs {
			specReqIDs := make(map[uuid.UUID]bool)
			for id := range coreReqIDs {
				specReqIDs[id] = true
			}
			for _, r := range reqs {
				if r.RequirementType != enums.RequirementTypeMajorChoice {
					continue
				}
				if len(r.Specializations) > 0 {
					for _, sTitle := range r.Specializations {
						if sTitle == spec.Title {
							specReqIDs[r.CourseID] = true
							break
						}
					}
				}
			}

			if len(specReqIDs) == 0 {
				continue
			}

			covered := 0
			canCover := 0
			for id := range specReqIDs {
				if passedUUIDs[id] {
					covered++
				} else {
					earliestSemester := earliestCompletionSemester(id, make(map[uuid.UUID]bool))
					if earliestSemester <= 8 {
						canCover++
					}
				}
			}
			score := float64(covered) / float64(len(specReqIDs))
			analysis = append(analysis, gin.H{
				"id":              spec.ID.String(),
				"major_id":        m.ID.String(),
				"title":           spec.Title,
				"cohort_year":     m.CohortYear,
				"score":           score,
				"covered_count":   covered,
				"can_cover_count": canCover,
				"total_count":     len(specReqIDs),
			})
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
