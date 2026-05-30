package api

import (
	"net/http"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/schemas"
	"github.com/cu-3rd-party/cu-roadmap/backend/service"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterPlannerRoutes(rg *gin.RouterGroup) {
	rg.POST("/generate", generateRoadmap)
	rg.POST("/validate-semester/", validateSemester)
	rg.POST("/validate-roadmap/", validateRoadmap)
	rg.POST("/goal-path/", getGoalPath)
	rg.GET("/test-engine2", testEngine2)
}

func generateRoadmap(c *gin.Context) {
	var req schemas.PlannerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	planner := service.NewGreedyPlanner(s)
	roadmap, err := planner.GenerateRoadmap(req.PassedCourseIDs, req.MajorID, req.CurrentSemester, req.MaxLoad, req.Cohort)
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
	if req.MaxLoad == 0 {
		req.MaxLoad = 12.0
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

	var courses []store.CourseData
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
		req.MaxLoad = 12.0
	}

	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	_, err := s.GetAllCourses()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	validator, err := service.CreateValidatorFromStore(s)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var roadmapData []map[string]interface{}
	for _, sem := range req.Roadmap {
		courseIDs := make([]string, len(sem.CourseIDs))
		for i, cid := range sem.CourseIDs {
			courseIDs[i] = cid.String()
		}
		roadmapData = append(roadmapData, map[string]interface{}{
			"semester":   sem.Semester,
			"course_ids": courseIDs,
		})
	}

	initialPassed := make(map[uuid.UUID]bool)
	for _, id := range req.PassedCourseIDs {
		initialPassed[id] = true
	}

	roadmapDataConverted := make([]map[string]interface{}, len(req.Roadmap))
	for i, sem := range req.Roadmap {
		courseIDs := make([]string, len(sem.CourseIDs))
		for j, cid := range sem.CourseIDs {
			courseIDs[j] = cid.String()
		}
		roadmapDataConverted[i] = map[string]interface{}{
			"semester":   sem.Semester,
			"course_ids": courseIDs,
		}
	}

	results := validator.ValidateFullRoadmap(roadmapDataConverted, initialPassed, req.MaxLoad)
	c.JSON(http.StatusOK, gin.H{"validation_results": results})
}

func getGoalPath(c *gin.Context) {
	var req schemas.GoalPathRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.CurrentSemester == 0 {
		req.CurrentSemester = 1
	}
	if req.MaxLoad == 0 {
		req.MaxLoad = 12.0
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

	path, err := planner.FindPathToCourse(req.TargetCourseID, passedIDs, req.CurrentSemester, req.MaxLoad)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"roadmap": path})
}

func testEngine2(c *gin.Context) {
	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	allStudents, err := s.GetAllStudents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(allStudents) == 0 {
		c.JSON(http.StatusOK, gin.H{"error": "No mock students found. Please run mock_data.py"})
		return
	}

	var student store.StudentData
	for _, st := range allStudents {
		student = st
		break
	}

	planner := service.NewGreedyPlanner(s)
	roadmap, err := planner.GenerateRoadmap(student.PassedCourseIDs, *student.TargetMajorID, student.CurrentSemester, 12.0, student.Cohort)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var majorIDStr string
	if student.TargetMajorID != nil {
		majorIDStr = student.TargetMajorID.String()
	}

	c.JSON(http.StatusOK, gin.H{
		"student_id":       student.ID.String(),
		"target_major_id":  majorIDStr,
		"current_semester": student.CurrentSemester,
		"roadmap":          roadmap,
	})
}
