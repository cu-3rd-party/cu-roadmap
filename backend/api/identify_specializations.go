package api

import (
	"encoding/json"
	"net/http"

	"github.com/cu-3rd-party/cu-roadmap/backend/requirements"
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
	analyzer := requirements.NewDependencyAnalyzer(coursesByID, deps, passedUUIDs, cohortYear, currentSemester, true)
	resolver := requirements.NewResolver(s)

	analysis := []gin.H{}
	for _, m := range majors {
		if majorIDFilter != nil && m.ID != *majorIDFilter {
			continue
		}
		if cohortYear != 0 && m.CohortYear != cohortYear {
			continue
		}
		specs, err := s.GetSpecializationsByMajor(m.ID)
		if err != nil {
			continue
		}

		if len(specs) == 0 {
			reqIDs, err := resolver.MajorChoiceCourseIDs(m.ID)
			if err != nil {
				continue
			}
			if len(reqIDs) == 0 {
				continue
			}

			requirementGroups := requirements.GroupCourseIDsByAnalog(reqIDs, coursesByID)

			covered := 0
			canCover := 0
			coveredCourses := make([]map[string]interface{}, 0)
			canCoverCourses := make([]map[string]interface{}, 0)
			cannotCoverCourses := make([]map[string]interface{}, 0)
			for _, group := range requirementGroups {
				groupCovered := false
				groupCanCover := false
				for id := range group {
					if analyzer.CourseCovered(id) {
						groupCovered = true
					} else {
						earliestSemester := analyzer.EarliestCompletionSemester(id)
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
				groupCoveredCourses, groupCanCoverCourses, groupCannotCoverCourses := analyzer.BuildCourseStatusDetails(group)
				coveredCourses = append(coveredCourses, groupCoveredCourses...)
				canCoverCourses = append(canCoverCourses, groupCanCoverCourses...)
				cannotCoverCourses = append(cannotCoverCourses, groupCannotCoverCourses...)
			}
			score := float64(covered) / float64(len(requirementGroups))
			analysis = append(analysis, gin.H{
				"id":                   m.ID.String(),
				"major_id":             m.ID.String(),
				"title":                m.Title,
				"cohort_year":          m.CohortYear,
				"score":                score,
				"covered_count":        covered,
				"can_cover_count":      canCover,
				"total_count":          len(requirementGroups),
				"covered_courses":      coveredCourses,
				"can_cover_courses":    canCoverCourses,
				"cannot_cover_courses": cannotCoverCourses,
			})
			continue
		}

		for _, spec := range specs {
			specReqIDs, err := resolver.SpecializationCourseIDs(spec)
			if err != nil {
				continue
			}
			if len(specReqIDs) == 0 {
				continue
			}

			requirementGroups := requirements.GroupCourseIDsByAnalog(specReqIDs, coursesByID)

			covered := 0
			canCover := 0
			coveredCourses := make([]map[string]interface{}, 0)
			canCoverCourses := make([]map[string]interface{}, 0)
			cannotCoverCourses := make([]map[string]interface{}, 0)
			for _, group := range requirementGroups {
				groupCovered := false
				groupCanCover := false
				for id := range group {
					if analyzer.CourseCovered(id) {
						groupCovered = true
					} else {
						earliestSemester := analyzer.EarliestCompletionSemester(id)
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
				groupCoveredCourses, groupCanCoverCourses, groupCannotCoverCourses := analyzer.BuildCourseStatusDetails(group)
				coveredCourses = append(coveredCourses, groupCoveredCourses...)
				canCoverCourses = append(canCoverCourses, groupCanCoverCourses...)
				cannotCoverCourses = append(cannotCoverCourses, groupCannotCoverCourses...)
			}
			score := float64(covered) / float64(len(requirementGroups))
			analysis = append(analysis, gin.H{
				"id":                   spec.ID.String(),
				"major_id":             m.ID.String(),
				"title":                spec.Title,
				"cohort_year":          m.CohortYear,
				"score":                score,
				"covered_count":        covered,
				"can_cover_count":      canCover,
				"total_count":          len(requirementGroups),
				"covered_courses":      coveredCourses,
				"can_cover_courses":    canCoverCourses,
				"cannot_cover_courses": cannotCoverCourses,
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
