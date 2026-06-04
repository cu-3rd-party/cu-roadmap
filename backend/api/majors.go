package api

import (
	"encoding/json"
	"math"
	"net/http"
	"strconv"

	"github.com/cu-3rd-party/cu-roadmap/backend/api/middleware"
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterMajorsRoutes(rg *gin.RouterGroup) {
	rg.GET("/", getMajors)
	rg.GET("/:cohort_year", getMajors)
	rg.POST("/identify", identifyMajor)
	rg.POST("/identify/:cohort_year", identifyMajor)

	admin := rg.Group("/")
	admin.Use(middleware.AuthMiddleware())
	admin.POST("/", createMajor)
	admin.PUT("/:id", updateMajor)
}

func getMajors(c *gin.Context) {
	cohortYear, ok := parseOptionalCohortYear(c)
	if !ok {
		return
	}

	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}
	if tryWriteCachedJSON(c, majorsCacheKey(c)) {
		return
	}
	majors, err := s.GetAllMajors()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	res := []gin.H{}
	for _, m := range majors {
		if cohortYear != 0 && m.CohortYear != cohortYear {
			continue
		}
		reqs, err := s.GetMajorRequirements(m.ID)
		if err != nil {
			continue
		}
		var reqList []gin.H
		for _, r := range reqs {
			reqList = append(reqList, gin.H{
				"course_id": r.CourseID.String(),
				"type":      string(r.RequirementType),
			})
		}
		res = append(res, gin.H{
			"id":           m.ID.String(),
			"title":        m.Title,
			"school":       m.School,
			"cohort_year":  m.CohortYear,
			"requirements": reqList,
		})
	}
	writeCachedJSON(c, majorsCacheKey(c), res)
}

func identifyMajor(c *gin.Context) {
	var rawMessage json.RawMessage
	if err := c.ShouldBindJSON(&rawMessage); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var passedIDs []string
	currentSemester := 1

	// Try array of strings first
	if err := json.Unmarshal(rawMessage, &passedIDs); err != nil {
		// Try struct format
		var req struct {
			PassedCourseIDs []string `json:"passed_course_ids"`
			CurrentSemester int      `json:"current_semester"`
		}
		if err2 := json.Unmarshal(rawMessage, &req); err2 != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
			return
		}
		passedIDs = req.PassedCourseIDs
		if req.CurrentSemester > 0 {
			currentSemester = req.CurrentSemester
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

	// Build prerequisite map: courseID -> list of required course IDs
	deps, _ := s.GetCourseDependencies()
	prereqMap := make(map[uuid.UUID][]uuid.UUID)
	for _, d := range deps {
		if d.DependencyType == enums.DependencyTypePrerequisite {
			prereqMap[d.CourseID] = append(prereqMap[d.CourseID], d.RequiredCourseID)
		}
	}

	// DFS to compute the earliest semester a course can be completed in,
	// accounting for prerequisite chains and semester availability.
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
		for _, pid := range prereqMap[id] {
			prereqSemester := earliestCompletionSemester(pid, visited)
			if prereqSemester == math.MaxInt32 {
				visited[id] = false
				return math.MaxInt32
			}
			if prereqSemester+1 > readySemester {
				readySemester = prereqSemester + 1
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

	var analysis []gin.H
	for _, m := range majors {
		if cohortYear != 0 && m.CohortYear != cohortYear {
			continue
		}
		reqs, err := s.GetMajorRequirements(m.ID)
		if err != nil {
			continue
		}
		reqIDs := make(map[uuid.UUID]bool)
		for _, r := range reqs {
			reqIDs[r.CourseID] = true
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
			"title":           m.Title,
			"cohort_year":     m.CohortYear,
			"score":           score,
			"covered_count":   covered,
			"can_cover_count": canCover,
			"total_count":     len(reqIDs),
		})
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

func cohortInSlice(cohort int, cohorts []int) bool {
	for _, c := range cohorts {
		if c == cohort {
			return true
		}
	}
	return false
}

func offeredInSemester(c interfaces.CourseData, semester int) bool {
	if len(c.AvailableSemesters) == 0 {
		return true
	}

	allOdd := true
	allEven := true
	for _, s := range c.AvailableSemesters {
		if s == semester {
			return true
		}
		if s%2 == 0 {
			allOdd = false
		} else {
			allEven = false
		}
	}

	if allOdd {
		return semester%2 != 0
	}
	if allEven {
		return semester%2 == 0
	}
	return false
}

func parseOptionalCohortYear(c *gin.Context) (int, bool) {
	cohortStr := c.Param("cohort_year")
	if cohortStr == "" {
		return 0, true
	}
	cohortYear, err := strconv.Atoi(cohortStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cohort_year"})
		return 0, false
	}
	return cohortYear, true
}

func updateMajor(c *gin.Context) {
	idParam := c.Param("id")
	majorID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid major id"})
		return
	}

	s := store.GetStore()
	var req struct {
		Title        string `json:"title" binding:"required"`
		School       string `json:"school"`
		Requirements []struct {
			CourseID string `json:"course_id"`
			Type     string `json:"type"`
		} `json:"requirements"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	existing, err := s.GetMajorByID(majorID)
	if err != nil || existing == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "major not found"})
		return
	}

	existing.Title = req.Title
	existing.School = req.School

	updated, err := s.UpdateMajor(*existing)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	err = s.DeleteMajorRequirements(majorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for _, r := range req.Requirements {
		cid, err := uuid.Parse(r.CourseID)
		if err != nil {
			continue
		}
		_, err = s.CreateMajorRequirement(interfaces.MajorRequirementData{
			ID:              uuid.New(),
			MajorID:         majorID,
			CourseID:        cid,
			RequirementType: enums.RequirementType(r.Type),
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	invalidateCachePrefixes("majors:", "courses:")

	c.JSON(http.StatusOK, gin.H{"id": updated.ID.String()})
}

func createMajor(c *gin.Context) {
	s := store.GetStore()
	var req struct {
		Title        string `json:"title" binding:"required"`
		School       string `json:"school"`
		Requirements []struct {
			CourseID string `json:"course_id"`
			Type     string `json:"type"`
		} `json:"requirements"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newMajor := interfaces.MajorData{
		ID:         uuid.New(),
		Title:      req.Title,
		School:     req.School,
		CohortYear: 2025, // default fallback
	}

	created, err := s.CreateMajor(newMajor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create major"})
		return
	}

	for _, r := range req.Requirements {
		parsedCourseID, err := uuid.Parse(r.CourseID)
		if err == nil {
			s.CreateMajorRequirement(interfaces.MajorRequirementData{
				ID:              uuid.New(),
				MajorID:         created.ID,
				CourseID:        parsedCourseID,
				RequirementType: enums.RequirementType(r.Type),
			})
		}
	}
	invalidateCachePrefixes("majors:")

	c.JSON(http.StatusOK, gin.H{"id": created.ID})
}
