package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/cu-3rd-party/cu-roadmap/backend/api/middleware"
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/requirements"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterMajorsRoutes(rg *gin.RouterGroup) {
	rg.GET("/", getMajors)
	rg.GET("/structure", getStructure)
	rg.GET("/:cohort_year", getMajors)
	rg.GET("/specializations/:id", getSpecializations)
	rg.POST("/identify", identifyMajor)
	rg.POST("/identify/:cohort_year", identifyMajor)
	rg.POST("/identify-specializations", identifySpecializations)
	rg.POST("/identify-specializations/:cohort_year", identifySpecializations)

	admin := rg.Group("/")
	admin.Use(middleware.AuthMiddleware())
	admin.POST("/", createMajor)
	admin.PUT("/:id", updateMajor)
	admin.DELETE("/:id", deleteMajor)
	admin.POST("/specializations", createSpecialization)

	// Course restrictions management
	admin.POST("/specializations/:id/restrictions", createCourseRestriction)
	admin.PUT("/restrictions/:id", updateCourseRestriction)
	admin.DELETE("/restrictions/:id", deleteCourseRestriction)
	admin.GET("/specializations/:id/restrictions", getCourseRestrictions)
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
	resolver := requirements.NewResolver(s)
	for _, m := range majors {
		internalName := ""
		switch m.Title {
		case "Искусственный интеллект":
			internalName = "ai"
		case "Разработка":
			internalName = "swe"
		case "Бизнес и аналитика":
			internalName = "business"
		}

		if cohortYear != 0 && m.CohortYear != cohortYear {
			continue
		}
		reqs, err := resolver.ProjectMajorRequirements(m.ID)
		if err != nil {
			continue
		}
		reqList := []gin.H{}
		for _, r := range reqs {
			specs := r.Specializations
			if specs == nil {
				specs = []string{}
			}
			reqList = append(reqList, gin.H{
				"course_id":       r.CourseID.String(),
				"type":            string(r.RequirementType),
				"specializations": specs,
			})
		}
		res = append(res, gin.H{
			"id":            m.ID.String(),
			"title":         m.Title,
			"internal_name": internalName,
			"school":        m.School,
			"cohort_year":   m.CohortYear,
			"requirements":  reqList,
		})
	}
	writeCachedJSON(c, majorsCacheKey(c), res)
}

func getStructure(c *gin.Context) {
	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}
	cacheKey := "structure_all"
	if tryWriteCachedJSON(c, cacheKey) {
		return
	}
	majors, err := s.GetAllMajors()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	type SpecDTO struct {
		ID    string `json:"id"`
		Title string `json:"title"`
	}

	type MajorDTO struct {
		ID              string    `json:"id"`
		Title           string    `json:"title"`
		InternalName    string    `json:"internal_name"`
		Specializations []SpecDTO `json:"specializations"`
	}

	type YearDTO struct {
		Year   int        `json:"year"`
		Majors []MajorDTO `json:"majors"`
	}

	type SchoolDTO struct {
		School      string    `json:"school"`
		CohortYears []YearDTO `json:"cohort_years"`
	}

	schoolsMap := make(map[string]map[int][]MajorDTO)

	for _, m := range majors {
		internalName := ""
		switch m.Title {
		case "Искусственный интеллект":
			internalName = "ai"
		case "Разработка":
			internalName = "swe"
		case "Бизнес и аналитика":
			internalName = "business"
		}

		if schoolsMap[m.School] == nil {
			schoolsMap[m.School] = make(map[int][]MajorDTO)
		}

		specs, err := s.GetSpecializationsByMajor(m.ID)
		specDTOs := []SpecDTO{}
		if err == nil {
			for _, sp := range specs {
				specDTOs = append(specDTOs, SpecDTO{
					ID:    sp.ID.String(),
					Title: sp.Title,
				})
			}
		}

		majorDTO := MajorDTO{
			ID:              m.ID.String(),
			Title:           m.Title,
			InternalName:    internalName,
			Specializations: specDTOs,
		}

		schoolsMap[m.School][m.CohortYear] = append(schoolsMap[m.School][m.CohortYear], majorDTO)
	}

	var res []SchoolDTO
	for schoolName, yearsMap := range schoolsMap {
		var yearDTOs []YearDTO
		for year, majorsList := range yearsMap {
			yearDTOs = append(yearDTOs, YearDTO{
				Year:   year,
				Majors: majorsList,
			})
		}
		res = append(res, SchoolDTO{
			School:      schoolName,
			CohortYears: yearDTOs,
		})
	}

	writeCachedJSON(c, cacheKey, res)
}

func getSpecializations(c *gin.Context) {
	idStr := c.Param("id")
	majorID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid major id"})
		return
	}

	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	specs, err := s.GetSpecializationsByMajor(majorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, specs)
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

	deps, _ := s.GetCourseDependencies()
	analyzer := requirements.NewDependencyAnalyzer(coursesByID, deps, passedUUIDs, cohortYear, currentSemester, false)
	resolver := requirements.NewResolver(s)

	analysis := []gin.H{}
	for _, m := range majors {
		if cohortYear != 0 && m.CohortYear != cohortYear {
			continue
		}
		reqIDs, err := resolver.MajorLeafCourseIDs(m.ID)
		if err != nil {
			continue
		}
		if len(reqIDs) == 0 {
			continue
		}
		covered := 0
		canCover := 0
		for id := range reqIDs {
			if analyzer.CourseCovered(id) {
				covered++
			} else {
				earliestSemester := analyzer.EarliestCompletionSemester(id)
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
		CohortYear   int    `json:"cohort_year"`
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
	if req.CohortYear != 0 {
		existing.CohortYear = req.CohortYear
	}

	updated, err := s.UpdateMajor(*existing)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	flatReqs := make([]requirements.FlatRequirementInput, 0, len(req.Requirements))
	for _, r := range req.Requirements {
		cid, err := uuid.Parse(r.CourseID)
		if err != nil {
			continue
		}
		flatReqs = append(flatReqs, requirements.FlatRequirementInput{ID: uuid.New(), CourseID: cid, RequirementType: enums.RequirementType(r.Type)})
	}
	err = requirements.ReplaceFlatRequirements(s, majorID, flatReqs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	invalidateCachePrefixes("majors:", "courses:", "structure_all")

	c.JSON(http.StatusOK, gin.H{"id": updated.ID.String()})
}

func deleteMajor(c *gin.Context) {
	idParam := c.Param("id")
	majorID, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid major id"})
		return
	}

	s := store.GetStore()
	if err := s.DeleteMajor(majorID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	invalidateCachePrefixes("majors:", "structure_all")

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func createMajor(c *gin.Context) {
	s := store.GetStore()
	var req struct {
		Title        string `json:"title" binding:"required"`
		School       string `json:"school"`
		CohortYear   int    `json:"cohort_year"`
		Requirements []struct {
			CourseID string `json:"course_id"`
			Type     string `json:"type"`
		} `json:"requirements"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	year := 2025
	if req.CohortYear != 0 {
		year = req.CohortYear
	}
	newMajor := interfaces.MajorData{
		ID:         uuid.New(),
		Title:      req.Title,
		School:     req.School,
		CohortYear: year,
	}

	created, err := s.CreateMajor(newMajor)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create major"})
		return
	}

	for _, r := range req.Requirements {
		parsedCourseID, err := uuid.Parse(r.CourseID)
		if err == nil {
			_ = requirements.AddFlatRequirement(s, created.ID, requirements.FlatRequirementInput{ID: uuid.New(), CourseID: parsedCourseID, RequirementType: enums.RequirementType(r.Type)})
		}
	}
	invalidateCachePrefixes("majors:", "structure_all")

	c.JSON(http.StatusOK, gin.H{"id": created.ID})
}

// Course Restriction Handlers

type CourseRestrictionRequest struct {
	Semester            int    `json:"semester" binding:"required,min=1"`
	Category            string `json:"category" binding:"required"`
	MinCourses          int    `json:"min_courses" binding:"min=0"`
	MaxCourses          int    `json:"max_courses" binding:"min=0"`
	InternalDescription string `json:"internal_description"`
}

func createCourseRestriction(c *gin.Context) {
	specIDStr := c.Param("id")
	specID, err := uuid.Parse(specIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid specialization id"})
		return
	}

	var req CourseRestrictionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	restriction := interfaces.CourseRestrictionData{
		ID:                  uuid.New(),
		SpecializationID:    specID,
		Semester:            req.Semester,
		Category:            enums.CourseCategory(req.Category),
		MinCourses:          req.MinCourses,
		MaxCourses:          req.MaxCourses,
		InternalDescription: req.InternalDescription,
	}

	created, err := s.CreateCourseRestriction(restriction)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, created)
}

func updateCourseRestriction(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid restriction id"})
		return
	}

	var req CourseRestrictionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	// Get existing to preserve specialization_id
	existing, err := s.GetCourseRestrictionByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if existing == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "restriction not found"})
		return
	}

	restriction := interfaces.CourseRestrictionData{
		ID:                  id,
		SpecializationID:    existing.SpecializationID,
		Semester:            req.Semester,
		Category:            enums.CourseCategory(req.Category),
		MinCourses:          req.MinCourses,
		MaxCourses:          req.MaxCourses,
		InternalDescription: req.InternalDescription,
	}

	updated, err := s.UpdateCourseRestriction(restriction)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}

func deleteCourseRestriction(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid restriction id"})
		return
	}

	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	if err := s.DeleteCourseRestriction(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func getCourseRestrictions(c *gin.Context) {
	specIDStr := c.Param("id")
	specID, err := uuid.Parse(specIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid specialization id"})
		return
	}

	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	restrictions, err := s.GetCourseRestrictionsBySpecialization(specID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, restrictions)
}

type CreateSpecializationRequest struct {
	MajorID string `json:"major_id" binding:"required"`
	Title   string `json:"title" binding:"required"`
}

func createSpecialization(c *gin.Context) {
	var req CreateSpecializationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}

	majorID, err := uuid.Parse(req.MajorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid major id"})
		return
	}

	spec := interfaces.SpecializationData{
		ID:      uuid.New(),
		MajorID: majorID,
		Title:   req.Title,
	}

	created, err := s.CreateSpecialization(spec)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// getStructure serves the year -> majors -> specializations tree from the
	// "structure_all" key, so without this the new specialization stays invisible
	// there for the whole 5 minute TTL.
	invalidateCachePrefixes("structure_all")

	c.JSON(http.StatusCreated, created)
}
