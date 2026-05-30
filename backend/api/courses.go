package api

import (
	"net/http"

	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/gin-gonic/gin"
)

func RegisterCoursesRoutes(rg *gin.RouterGroup) {
	rg.GET("/", getCourses)
}

func getCourses(c *gin.Context) {
	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}
	courses, err := s.GetAllCourses()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var res []gin.H
	for _, c := range courses {
		prereqs := make([]string, len(c.Prerequisites))
		for i, p := range c.Prerequisites {
			prereqs[i] = p.String()
		}
		res = append(res, gin.H{
			"id":                   c.ID.String(),
			"title":                c.Title,
			"description":          c.Description,
			"course_type":          string(c.CourseType),
			"category":             string(c.Category),
			"available_semesters":  c.AvailableSemesters,
			"allowed_cohorts":      c.AllowedCohorts,
			"recommended_semester": c.RecommendedSemester,
			"workload":             c.Workload,
			"prerequisites":        prereqs,
		})
	}
	c.JSON(http.StatusOK, res)
}
