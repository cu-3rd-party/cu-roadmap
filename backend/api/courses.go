package api

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/cu-3rd-party/cu-roadmap/backend/api/middleware"
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/schemas"
	"github.com/cu-3rd-party/cu-roadmap/backend/requirements"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/helpers"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterCoursesRoutes(rg *gin.RouterGroup) {
	rg.GET("/", getCourses)
	rg.GET("/:cohort_year", getCourses)
	rg.GET("/:cohort_year/:major_id", getCourses)

	admin := rg.Group("/")
	admin.Use(middleware.AuthMiddleware())
	admin.POST("/", createCourse)
	admin.PUT("/:id", updateCourse)
	admin.DELETE("/:id", deleteCourse)
	admin.POST("/restore", restoreDB)
	admin.GET("/backup", backupDB)
}

func getCourses(c *gin.Context) {
	s := store.GetStore()
	if s == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "store not initialized"})
		return
	}
	if tryWriteCachedJSON(c, coursesCacheKey(c)) {
		return
	}
	f := parseCourseFilter(c)

	var majorID uuid.UUID
	if cohortStr := c.Param("cohort_year"); cohortStr != "" {
		if parsedMajorID, err := uuid.Parse(cohortStr); err == nil {
			majorID = parsedMajorID
		} else {
			year, err := strconv.Atoi(cohortStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cohort_year or major id"})
				return
			}
			if len(f.CohortYears) == 0 {
				f.CohortYears = []int{year}
			}
		}
	}

	if majorIDParam := c.Param("major_id"); majorIDParam != "" {
		parsedMajorID, err := uuid.Parse(majorIDParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid major id"})
			return
		}
		majorID = parsedMajorID
	}

	var err error
	var majorData *interfaces.MajorData
	if majorID != uuid.Nil {
		majorData, err = s.GetMajorByID(majorID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if majorData == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "major not found"})
			return
		}
	}

	courses, err := s.GetCourses(f)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	allReqs, err := requirements.NewResolver(s).ProjectAllMajorRequirements()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	courseToMajor := make(map[uuid.UUID]map[uuid.UUID]string)
	for _, req := range allReqs {
		if courseToMajor[req.CourseID] == nil {
			courseToMajor[req.CourseID] = make(map[uuid.UUID]string)
		}
		courseToMajor[req.CourseID][req.MajorID] = string(req.RequirementType)
	}

	majorRequirementByCourse := make(map[uuid.UUID]enums.RequirementType)
	for _, req := range allReqs {
		if majorID != uuid.Nil && req.MajorID != majorID {
			continue
		}
		if req.MajorID == majorID {
			majorRequirementByCourse[req.CourseID] = req.RequirementType
		}
	}

	courseToSpecializations := make(map[uuid.UUID]map[uuid.UUID]struct{})
	specializationsByMajor := make(map[uuid.UUID]map[string]uuid.UUID)
	for _, req := range allReqs {
		if majorID != uuid.Nil && req.MajorID != majorID {
			continue
		}
		if len(req.Specializations) == 0 {
			continue
		}
		majorSpecs, ok := specializationsByMajor[req.MajorID]
		if !ok {
			specs, err := s.GetSpecializationsByMajor(req.MajorID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			majorSpecs = make(map[string]uuid.UUID)
			for _, sp := range specs {
				majorSpecs[sp.Title] = sp.ID
			}
			specializationsByMajor[req.MajorID] = majorSpecs
		}

		for _, specTitle := range req.Specializations {
			if specID, ok := majorSpecs[specTitle]; ok {
				if courseToSpecializations[req.CourseID] == nil {
					courseToSpecializations[req.CourseID] = make(map[uuid.UUID]struct{})
				}
				courseToSpecializations[req.CourseID][specID] = struct{}{}
			}
		}
	}

	allDeps, err := s.GetCourseDependencies()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	analogGroupSizes := make(map[string]int)
	for _, course := range courses {
		key := strings.ToLower(strings.TrimSpace(course.AnalogGroup))
		if key != "" {
			analogGroupSizes[key]++
		}
	}

	res := []gin.H{}
	for _, course := range courses {
		item := helpers.CourseToResponse(course, allDeps, analogGroupSizes)
		if m, ok := courseToMajor[course.ID]; ok {
			toMajor := make(gin.H)
			for majorID, reqType := range m {
				toMajor[majorID.String()] = reqType
			}
			item["to_major"] = toMajor
		} else {
			item["to_major"] = gin.H{}
		}

		if majorID != uuid.Nil {
			if requirementType, ok := majorRequirementByCourse[course.ID]; ok {
				switch requirementType {
				case enums.RequirementTypeMajorCore:
					item["by_major_type"] = "core"
					if majorData != nil {
						item["category"] = inferMajorCategory(majorData)
					}
				case enums.RequirementTypeMajorChoice:
					item["by_major_type"] = "choice"
					if majorData != nil {
						item["category"] = inferMajorCategory(majorData)
					}
				case enums.RequirementTypeFlex:
					item["by_major_type"] = "flex"
				default:
					item["by_major_type"] = classifyCourseByCategory(course.Category, course.CourseType)
				}
			} else {
				item["by_major_type"] = classifyCourseByCategory(course.Category, course.CourseType)
			}
		} else {
			item["by_major_type"] = classifyCourseByCategory(course.Category, course.CourseType)
		}

		if item["by_major_type"] == "other" || item["by_major_type"] == "flex" {
			item["course_type"] = item["by_major_type"]
		}

		specializationIDs := make([]string, 0)
		if ids, ok := courseToSpecializations[course.ID]; ok {
			for specID := range ids {
				specializationIDs = append(specializationIDs, specID.String())
			}
		}
		item["specializations"] = specializationIDs
		res = append(res, item)
	}
	writeCachedJSON(c, coursesCacheKey(c), res)
}

func classifyCourseByCategory(category enums.CourseCategory, courseType enums.CourseType) string {
	if category == enums.CourseCategoryFundamentals {
		if courseType == enums.CourseTypeElective {
			return "elective"
		}
		return "other"
	}

	switch category {
	case enums.CourseCategorySoft, enums.CourseCategorySTEM:
		return "flex"
	default:
		return "elective"
	}
}

func inferMajorCategory(major *interfaces.MajorData) string {
	if major == nil {
		return ""
	}
	switch major.Title {
	case "Искусственный интеллект":
		return "ai"
	case "Разработка":
		return "swe"
	case "Бизнес и аналитика":
		return "business"
	default:
		return ""
	}
}

func createCourse(c *gin.Context) {
	s := store.GetStore()
	var req schemas.CreateCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := req.Validate()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	course := interfaces.CourseData{
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
	invalidateCachePrefixes("courses:", "majors:")

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
	err = req.Validate()
	if err != nil {
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
	invalidateCachePrefixes("courses:", "majors:")

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
	invalidateCachePrefixes("courses:", "majors:")
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

type BackupCourse struct {
	ID                  string               `json:"id"`
	Title               string               `json:"title"`
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

func backupDB(c *gin.Context) {
	s := store.GetStore()
	courses, _ := s.GetCourses(interfaces.CourseFilter{})
	var backupCourses []BackupCourse
	for _, cd := range courses {
		backupCourses = append(backupCourses, BackupCourse{
			ID:                  cd.ID.String(),
			Title:               cd.Title,
			Description:         cd.Description,
			HandbookLink:        cd.HandbookLink,
			CourseType:          cd.CourseType,
			Category:            cd.Category,
			AllowedCohorts:      cd.AllowedCohorts,
			AvailableSemesters:  cd.AvailableSemesters,
			RecommendedSemester: cd.RecommendedSemester,
			Workload:            cd.Workload,
			Prerequisites:       helpers.CourseUUIDsToStrings(cd.Prerequisites),
			Corequisites:        helpers.CourseUUIDsToStrings(cd.Corequisites),
		})
	}
	file, _ := json.MarshalIndent(backupCourses, "", "  ")
	os.WriteFile("courses_backup.json", file, 0o644)

	majors, _ := s.GetAllMajors()
	resolver := requirements.NewResolver(s)
	var backupMajors []map[string]interface{}
	for _, m := range majors {
		reqs, _ := resolver.ProjectMajorRequirements(m.ID)
		var reqsList []map[string]interface{}
		for _, r := range reqs {
			reqsList = append(reqsList, map[string]interface{}{
				"course_id": r.CourseID.String(),
				"type":      string(r.RequirementType),
			})
		}
		backupMajors = append(backupMajors, map[string]interface{}{
			"id":           m.ID.String(),
			"title":        m.Title,
			"school":       m.School,
			"cohort_year":  m.CohortYear,
			"requirements": reqsList,
		})
	}
	majorsFile, _ := json.MarshalIndent(backupMajors, "", "  ")
	os.WriteFile("majors_backup.json", majorsFile, 0o644)

	c.JSON(http.StatusOK, gin.H{"status": "backed_up", "courses_count": len(backupCourses), "majors_count": len(backupMajors)})
}

func restoreDB(c *gin.Context) {
	s := store.GetStore()
	s.ClearAll()
	coursesFile, err := os.ReadFile("courses_backup.json")
	if err == nil {
		var courses []BackupCourse
		json.Unmarshal(coursesFile, &courses)
		for _, rc := range courses {
			id, _ := uuid.Parse(rc.ID)
			s.CreateCourse(interfaces.CourseData{
				ID: id, Title: rc.Title, Description: rc.Description,
				HandbookLink: rc.HandbookLink, CourseType: rc.CourseType,
				Category: rc.Category, AllowedCohorts: rc.AllowedCohorts,
				AvailableSemesters:  rc.AvailableSemesters,
				RecommendedSemester: rc.RecommendedSemester, Workload: rc.Workload,
			})
			helpers.ReplaceCourseDependencies(s, id, rc.Prerequisites, rc.Corequisites)
		}
	}
	majorsFile, err := os.ReadFile("majors_backup.json")
	if err == nil {
		var majors []map[string]interface{}
		json.Unmarshal(majorsFile, &majors)
		for _, rm := range majors {
			id, _ := uuid.Parse(rm["id"].(string))
			cohortYear := 0
			if cy, ok := rm["cohort_year"].(float64); ok {
				cohortYear = int(cy)
			}
			s.CreateMajor(interfaces.MajorData{
				ID: id, Title: rm["title"].(string), School: rm["school"].(string), CohortYear: cohortYear,
			})
			if reqs, ok := rm["requirements"].([]interface{}); ok {
				flatReqs := make([]requirements.FlatRequirementInput, 0, len(reqs))
				for _, r := range reqs {
					reqMap := r.(map[string]interface{})
					cid, _ := uuid.Parse(reqMap["course_id"].(string))
					flatReqs = append(flatReqs, requirements.FlatRequirementInput{ID: uuid.New(), CourseID: cid, RequirementType: enums.RequirementType(reqMap["type"].(string))})
				}
				if err := requirements.ReplaceFlatRequirements(s, id, flatReqs); err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
			}
		}
	}
	invalidateCachePrefixes("courses:", "majors:")
	c.JSON(http.StatusOK, gin.H{"status": "restored"})
}
