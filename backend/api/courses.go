package api

import (
	"net/http"
	"os"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("X-Admin-Token")
		expected := os.Getenv("ADMIN_PASSWORD")
		if expected == "" {
			expected = "admin"
		}
		if token != expected {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		c.Next()
	}
}

func RegisterCoursesRoutes(rg *gin.RouterGroup) {
	rg.GET("/", getCourses)

	admin := rg.Group("/")
	admin.Use(authMiddleware())
	admin.POST("/", createCourse)
	admin.PUT("/:id", updateCourse)
	admin.DELETE("/:id", deleteCourse)
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
		coreqs := make([]string, len(c.Corequisites))
		for i, p := range c.Corequisites {
			coreqs[i] = p.String()
		}
		res = append(res, gin.H{
			"id":                   c.ID.String(),
			"title":                c.Title,
			"description":          c.Description,
			"handbook_link":        c.HandbookLink,
			"course_type":          string(c.CourseType),
			"category":             string(c.Category),
			"available_semesters":  c.AvailableSemesters,
			"allowed_cohorts":      c.AllowedCohorts,
			"recommended_semester": c.RecommendedSemester,
			"workload":             c.Workload,
			"prerequisites":        prereqs,
			"corequisites":         coreqs,
		})
	}
	c.JSON(http.StatusOK, res)
}

func createCourse(c *gin.Context) {
	s := store.GetStore()
	var req struct {
		Title               string               `json:"title" binding:"required"`
		Description         *string              `json:"description"`
		HandbookLink        *string              `json:"handbook_link"`
		CourseType          enums.CourseType     `json:"course_type"`
		Category            enums.CourseCategory `json:"category"`
		AllowedCohorts      []int                `json:"allowed_cohorts"`
		AvailableSemesters  []int                `json:"available_semesters"`
		RecommendedSemester *int                 `json:"recommended_semester"`
		Workload            float64              `json:"workload"`
		Prerequisites       []string             `json:"prerequisites"`
		Corequisites        []string             `json:"corequisites"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	course := store.CourseData{
		ID:                  uuid.New(),
		Title:               req.Title,
		Description:         req.Description,
		HandbookLink:        req.HandbookLink,
		CourseType:          req.CourseType,
		Category:            req.Category,
		AllowedCohorts:      req.AllowedCohorts,
		AvailableSemesters:  req.AvailableSemesters,
		RecommendedSemester: req.RecommendedSemester,
		Workload:            req.Workload,
	}

	created, err := s.CreateCourse(course)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, p := range req.Prerequisites {
		if pid, err := uuid.Parse(p); err == nil {
			s.CreateCourseDependency(store.CourseDependencyData{
				ID:               uuid.New(),
				CourseID:         created.ID,
				RequiredCourseID: pid,
				DependencyType:   enums.DependencyTypePrerequisite,
			})
		}
	}
	for _, p := range req.Corequisites {
		if pid, err := uuid.Parse(p); err == nil {
			s.CreateCourseDependency(store.CourseDependencyData{
				ID:               uuid.New(),
				CourseID:         created.ID,
				RequiredCourseID: pid,
				DependencyType:   enums.DependencyTypeCorequisite1,
			})
		}
	}

	c.JSON(http.StatusCreated, gin.H{"id": created.ID.String()})
}

func updateCourse(c *gin.Context) {
	idParam := c.Param("id")
	courseID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid course id"})
		return
	}

	s := store.GetStore()
	var req struct {
		Title               string               `json:"title" binding:"required"`
		Description         *string              `json:"description"`
		HandbookLink        *string              `json:"handbook_link"`
		CourseType          enums.CourseType     `json:"course_type"`
		Category            enums.CourseCategory `json:"category"`
		AllowedCohorts      []int                `json:"allowed_cohorts"`
		AvailableSemesters  []int                `json:"available_semesters"`
		RecommendedSemester *int                 `json:"recommended_semester"`
		Workload            float64              `json:"workload"`
		Prerequisites       []string             `json:"prerequisites"`
		Corequisites        []string             `json:"corequisites"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	existing, err := s.GetCourseByID(courseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if existing == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "course not found"})
		return
	}

	existing.Title = req.Title
	existing.Description = req.Description
	existing.HandbookLink = req.HandbookLink
	existing.CourseType = req.CourseType
	existing.Category = req.Category
	existing.AllowedCohorts = req.AllowedCohorts
	existing.AvailableSemesters = req.AvailableSemesters
	existing.RecommendedSemester = req.RecommendedSemester
	existing.Workload = req.Workload

	updated, err := s.UpdateCourse(*existing)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	s.DeleteCourseDependencies(updated.ID)
	for _, p := range req.Prerequisites {
		if pid, err := uuid.Parse(p); err == nil {
			s.CreateCourseDependency(store.CourseDependencyData{
				ID:               uuid.New(),
				CourseID:         updated.ID,
				RequiredCourseID: pid,
				DependencyType:   enums.DependencyTypePrerequisite,
			})
		}
	}
	for _, p := range req.Corequisites {
		if pid, err := uuid.Parse(p); err == nil {
			s.CreateCourseDependency(store.CourseDependencyData{
				ID:               uuid.New(),
				CourseID:         updated.ID,
				RequiredCourseID: pid,
				DependencyType:   enums.DependencyTypeCorequisite1,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{"id": updated.ID.String()})
}

func deleteCourse(c *gin.Context) {
	idParam := c.Param("id")
	courseID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid course id"})
		return
	}

	s := store.GetStore()
	if err := s.DeleteCourse(courseID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}
