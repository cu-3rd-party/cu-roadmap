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

		coreReqIDs, _ := resolver.MajorCoreCourseIDs(m.ID)
		if len(coreReqIDs) > 0 {
			coreGroups := requirements.GroupCourseIDsByAnalog(coreReqIDs, coursesByID)
			coreTotalCount := len(coreGroups)
			coreCovered := 0
			coreCanCover := 0
			coreCompletedIDs := make([]string, 0)
			coreCanCoverIDs := make([]string, 0)
			coreCannotCoverIDs := make([]string, 0)
			for _, group := range coreGroups {
				groupCovered := false
				groupCanCover := false
				for id := range group {
					if analyzer.CourseCovered(id) {
						groupCovered = true
					} else {
						if analyzer.EarliestCompletionSemester(id) <= 8 {
							groupCanCover = true
						}
					}
				}
				if groupCovered {
					coreCovered++
				}
				if groupCanCover {
					coreCanCover++
				}
				gCov, gCan, gCannot := analyzer.CategorizeCourseIDs(group)
				coreCompletedIDs = append(coreCompletedIDs, gCov...)
				coreCanCoverIDs = append(coreCanCoverIDs, gCan...)
				coreCannotCoverIDs = append(coreCannotCoverIDs, gCannot...)
			}
			coreScore := 0.0
			if coreTotalCount > 0 {
				coreScore = float64(coreCovered) / float64(coreTotalCount)
			}
			coreID := uuid.NewSHA1(uuid.NameSpaceOID, []byte(m.ID.String()+"-core"))
			analysis = append(analysis, gin.H{
				"id":               coreID.String(),
				"major_id":         m.ID.String(),
				"title":            "Обязательные дисциплины",
				"cohort_year":      m.CohortYear,
				"score":            coreScore,
				"covered_count":    coreCovered,
				"can_cover_count":  coreCanCover,
				"total_count":      coreTotalCount,
				"is_core":          true,
				"completed_ids":    coreCompletedIDs,
				"can_cover_ids":    coreCanCoverIDs,
				"cannot_cover_ids": coreCannotCoverIDs,
			})
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
			completedIDs := make([]string, 0)
			canCoverIDs := make([]string, 0)
			cannotCoverIDs := make([]string, 0)
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
				gCov, gCan, gCannot := analyzer.CategorizeCourseIDs(group)
				completedIDs = append(completedIDs, gCov...)
				canCoverIDs = append(canCoverIDs, gCan...)
				cannotCoverIDs = append(cannotCoverIDs, gCannot...)
			}
			score := float64(covered) / float64(len(requirementGroups))
			analysis = append(analysis, gin.H{
				"id":               m.ID.String(),
				"major_id":         m.ID.String(),
				"title":            m.Title,
				"cohort_year":      m.CohortYear,
				"score":            score,
				"covered_count":    covered,
				"can_cover_count":  canCover,
				"total_count":      len(requirementGroups),
				"is_core":          false,
				"completed_ids":    completedIDs,
				"can_cover_ids":    canCoverIDs,
				"cannot_cover_ids": cannotCoverIDs,
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
			completedIDs := make([]string, 0)
			canCoverIDs := make([]string, 0)
			cannotCoverIDs := make([]string, 0)
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
				gCov, gCan, gCannot := analyzer.CategorizeCourseIDs(group)
				completedIDs = append(completedIDs, gCov...)
				canCoverIDs = append(canCoverIDs, gCan...)
				cannotCoverIDs = append(cannotCoverIDs, gCannot...)
			}
			score := float64(covered) / float64(len(requirementGroups))
			analysis = append(analysis, gin.H{
				"id":               spec.ID.String(),
				"major_id":         m.ID.String(),
				"title":            spec.Title,
				"cohort_year":      m.CohortYear,
				"score":            score,
				"covered_count":    covered,
				"can_cover_count":  canCover,
				"total_count":      len(requirementGroups),
				"is_core":          false,
				"completed_ids":    completedIDs,
				"can_cover_ids":    canCoverIDs,
				"cannot_cover_ids": cannotCoverIDs,
			})
		}
	}

	for i := 0; i < len(analysis); i++ {
		for j := i + 1; j < len(analysis); j++ {
			isCoreI, _ := analysis[i]["is_core"].(bool)
			isCoreJ, _ := analysis[j]["is_core"].(bool)
			if isCoreJ && !isCoreI {
				analysis[i], analysis[j] = analysis[j], analysis[i]
			} else if isCoreI == isCoreJ && analysis[j]["score"].(float64) > analysis[i]["score"].(float64) {
				analysis[i], analysis[j] = analysis[j], analysis[i]
			}
		}
	}

	c.JSON(http.StatusOK, analysis)
}
