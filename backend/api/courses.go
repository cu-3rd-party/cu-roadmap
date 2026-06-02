package api

import (
	"net/http"

	"github.com/cu-3rd-party/cu-roadmap/backend/api/middleware"
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/schemas"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/helpers"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterCoursesRoutes(rg *gin.RouterGroup) {
	rg.GET("/", getCourses)

	admin := rg.Group("/")
	admin.Use(middleware.AuthMiddleware())
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
	for _, course := range courses {
		res = append(res, helpers.CourseToResponse(course))
	}
	c.JSON(http.StatusOK, res)
}

func createCourse(c *gin.Context) {
	s := store.GetStore()
	var req schemas.CreateCourseRequest
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

	if err := helpers.SaveCourseDependencies(s, created.ID, req.Prerequisites, req.Corequisites); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
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
	var req schemas.UpdateCourseRequest
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

	if err := helpers.ReplaceCourseDependencies(s, updated.ID, req.Prerequisites, req.Corequisites); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": updated.ID.String()})
}

func deleteCourse(c *gin.Context) {
	courseID, err := uuid.Parse(c.Param("id"))
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
