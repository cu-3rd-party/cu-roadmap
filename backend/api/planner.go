package api

import (
	"net/http"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/schemas"
	"github.com/cu-3rd-party/cu-roadmap/backend/service"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterPlannerRoutes(rg *gin.RouterGroup) {
	rg.POST("/generate", generateRoadmap)
	rg.POST("/validate-semester/", validateSemester)
	rg.POST("/validate-roadmap/", validateRoadmap)
	rg.POST("/goal-path/", getGoalPath)
}

func generateRoadmap(c *gin.Context) {
	var req schemas.PlannerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := req.Validate()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	planner, err := service.NewRoadmapPlanner(service.PlannerKindDynamicProgramming, s)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	roadmap, err := planner.GenerateRoadmap(req.PassedCourseIDs, req.SelectedCourseIDs, req.MajorID, req.SpecializationID, req.CurrentSemester, req.MaxLoad, req.Cohort)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"major_id": req.MajorID.String(),
		"roadmap":  roadmap,
	})
}

func validateSemester(c *gin.Context) {
	var req schemas.SemesterValidationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := req.Validate()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	allCourses, err := s.GetAllCourses()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	validator, err := service.CreateValidatorFromStore(s)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var courses []interfaces.CourseData
	for _, cid := range req.CourseIDs {
		if c, ok := allCourses[cid]; ok {
			courses = append(courses, c)
		}
	}

	passedIDs := make(map[uuid.UUID]bool)
	for _, id := range req.PassedCourseIDs {
		passedIDs[id] = true
	}

	result := validator.ValidateSemester(courses, passedIDs, req.CurrentSemester, req.MaxLoad)
	c.JSON(http.StatusOK, result)
}

func validateRoadmap(c *gin.Context) {
	var req schemas.RoadmapValidationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.MaxLoad == 0 {
		req.MaxLoad = 60.0
	}
	if req.CurrentSemester == 0 {
		req.CurrentSemester = 1
	}
	err := req.Validate()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	_, err = s.GetAllCourses()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	validator, err := service.CreateValidatorFromStore(s)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	initialPassed := make(map[uuid.UUID]bool)
	var roadmapData []map[string]interface{}

	for _, sem := range req.Roadmap {
		courseIDs := make([]string, len(sem.CourseIDs))
		for i, cid := range sem.CourseIDs {
			courseIDs[i] = cid.String()
			if sem.Semester < req.CurrentSemester {
				initialPassed[cid] = true
			}
		}
		roadmapData = append(roadmapData, map[string]interface{}{
			"semester":   sem.Semester,
			"course_ids": courseIDs,
		})
	}

	results := validator.ValidateFullRoadmap(roadmapData, initialPassed, req.MaxLoad)
	c.JSON(http.StatusOK, gin.H{"validation_results": results})
}

func getGoalPath(c *gin.Context) {
	var req schemas.GoalPathRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := req.Validate()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.CurrentSemester == 0 {
		req.CurrentSemester = 1
	}
	if req.MaxLoad == 0 {
		req.MaxLoad = 60.0
	}

	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	planner := service.NewPlannerService(s)
	passedIDs := make(map[uuid.UUID]bool)
	for _, id := range req.PassedCourseIDs {
		passedIDs[id] = true
	}

	path, err := planner.FindPathToCourse(req.TargetCourseID, passedIDs, req.CurrentSemester, req.MaxLoad, req.GoalSemester)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"roadmap": path})
}
