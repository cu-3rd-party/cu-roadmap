package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/cu-3rd-party/cu-roadmap/backend/store"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func setupRouter(t *testing.T, seed func(s interfaces.StoreBase)) *gin.RouterGroup {
	t.Helper()

	s, err := initTestStore(t)
	assert.NoError(t, err)

	if seed != nil {
		seed(s)
	}

	router := gin.New()
	apiV1 := router.Group("/api/v1")
	RegisterDocsRoutes(apiV1)
	RegisterGraphRoutes(apiV1.Group("/graph"))
	RegisterMajorsRoutes(apiV1.Group("/majors"))
	RegisterCoursesRoutes(apiV1.Group("/courses"))
	RegisterPlannerRoutes(apiV1.Group("/planner"))
	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	return router.Group("")
}

func setupRouterRoot(t *testing.T, seed func(s interfaces.StoreBase)) *gin.Engine {
	t.Helper()

	s, err := initTestStore(t)
	assert.NoError(t, err)

	if seed != nil {
		seed(s)
	}

	router := gin.New()
	apiV1 := router.Group("/api/v1")
	RegisterDocsRoutes(apiV1)
	RegisterGraphRoutes(apiV1.Group("/graph"))
	RegisterMajorsRoutes(apiV1.Group("/majors"))
	RegisterCoursesRoutes(apiV1.Group("/courses"))
	RegisterPlannerRoutes(apiV1.Group("/planner"))
	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	return router
}

func TestHealthEndpoint(t *testing.T) {
	router := setupRouterRoot(t, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/health", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "healthy", resp["status"])
}

func TestDocsEndpoint(t *testing.T) {
	router := setupRouterRoot(t, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/docs", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	assert.Contains(t, w.Header().Get("Content-Type"), "text/html")
	assert.Contains(t, w.Body.String(), "SwaggerUIBundle")
	assert.Contains(t, w.Body.String(), "/api/v1/docs/openapi.yaml")
}

func TestDocsOpenAPISpecEndpoint(t *testing.T) {
	router := setupRouterRoot(t, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/docs/openapi.yaml", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	assert.Contains(t, w.Header().Get("Content-Type"), "application/yaml")
	assert.Contains(t, w.Body.String(), "openapi: 3.1.0")
}

func TestGetCoursesEmpty(t *testing.T) {
	router := setupRouterRoot(t, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/courses/", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	assert.Equal(t, "[]", strings.TrimSpace(w.Body.String()))
}

func TestGetCoursesWithData(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		c := interfaces.CourseData{
			ID:                 uuid.New(),
			Title:              "Python",
			Category:           enums.CourseCategoryTech,
			AvailableSemesters: []int{1, 2},
			Workload:           4.0,
		}
		s.CreateCourse(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/courses/", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var courses []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &courses)
	assert.Len(t, courses, 1)
	assert.Equal(t, "Python", courses[0]["title"])
	assert.Equal(t, "tech", courses[0]["category"])
	assert.Equal(t, float64(4.0), courses[0]["workload"])
}

func TestGetCoursesReturnsPostrequisites(t *testing.T) {
	baseID := uuid.New()
	advancedID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		_, _ = s.CreateCourse(interfaces.CourseData{
			ID:                 baseID,
			Title:              "Base",
			AvailableSemesters: []int{1},
			Workload:           3.0,
		})
		_, _ = s.CreateCourse(interfaces.CourseData{
			ID:                 advancedID,
			Title:              "Advanced",
			AvailableSemesters: []int{2},
			Workload:           4.0,
		})
		_, _ = s.CreateCourseDependency(interfaces.CourseDependencyData{
			ID:               uuid.New(),
			CourseID:         advancedID,
			RequiredCourseID: baseID,
			DependencyType:   enums.DependencyTypePrerequisite,
		})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/courses/", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	var courses []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &courses)

	byID := make(map[string]map[string]interface{}, len(courses))
	for _, course := range courses {
		byID[course["id"].(string)] = course
	}

	assert.ElementsMatch(t, []interface{}{advancedID.String()}, byID[baseID.String()]["postrequisites"])
	assert.ElementsMatch(t, []interface{}{baseID.String()}, byID[advancedID.String()]["prerequisites"])
	assert.Empty(t, byID[advancedID.String()]["postrequisites"])
}

func TestGetCoursesReturnsSpecializations(t *testing.T) {
	majorID := uuid.New()
	specID := uuid.New()
	courseID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		_, _ = s.CreateMajor(interfaces.MajorData{ID: majorID, Title: "SE", School: "Tech"})
		_, _ = s.CreateSpecialization(interfaces.SpecializationData{ID: specID, MajorID: majorID, Title: "Web"})
		_, _ = s.CreateCourse(interfaces.CourseData{ID: courseID, Title: "Web Basics", AvailableSemesters: []int{1}, Workload: 3.0})
		_, _ = s.CreateMajorRequirement(interfaces.MajorRequirementData{
			ID:              uuid.New(),
			MajorID:         majorID,
			CourseID:        courseID,
			RequirementType: enums.RequirementTypeMajorChoice,
			Specializations: []string{"Web"},
		})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/courses/", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	var courses []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &courses)

	assert.Len(t, courses, 1)
	specializations, ok := courses[0]["specializations"].([]interface{})
	assert.True(t, ok)
	assert.ElementsMatch(t, []interface{}{specID.String()}, specializations)
}

func TestGetMajorsEmpty(t *testing.T) {
	router := setupRouterRoot(t, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/majors/", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	assert.Equal(t, "[]", strings.TrimSpace(w.Body.String()))
}

func TestGetMajorsWithData(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		m := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech"}
		s.CreateMajor(m)
		c := interfaces.CourseData{ID: uuid.New(), Title: "Python", AvailableSemesters: []int{1}, Workload: 4.0}
		s.CreateCourse(c)
		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: m.ID, CourseID: c.ID, RequirementType: enums.RequirementTypeMajorCore})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/majors/", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var majors []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &majors)
	assert.Len(t, majors, 1)
	assert.Equal(t, "SE", majors[0]["title"])
	assert.Equal(t, "Tech", majors[0]["school"])
	assert.Equal(t, float64(0), majors[0]["cohort_year"])
	reqs, ok := majors[0]["requirements"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, reqs, 1)
}

func TestGetMajorsWithCohortYear(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		m2025 := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech", CohortYear: 2025}
		m2026 := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech", CohortYear: 2026}
		s.CreateMajor(m2025)
		s.CreateMajor(m2026)
		c1 := interfaces.CourseData{ID: uuid.New(), Title: "Python", AllowedCohorts: []int{2025}, AvailableSemesters: []int{1}, Workload: 4.0}
		c2 := interfaces.CourseData{ID: uuid.New(), Title: "Math", AllowedCohorts: []int{2026}, AvailableSemesters: []int{1}, Workload: 4.0}
		s.CreateCourse(c1)
		s.CreateCourse(c2)
		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: m2025.ID, CourseID: c1.ID, RequirementType: enums.RequirementTypeMajorCore})
		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: m2026.ID, CourseID: c2.ID, RequirementType: enums.RequirementTypeMajorCore})
	})

	t.Run("without cohort returns all majors", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/majors/", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
		var majors []map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &majors)
		assert.Len(t, majors, 2)
	})

	t.Run("with cohort filters majors", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/majors/2025", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
		var majors []map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &majors)
		assert.Len(t, majors, 1)
		assert.Equal(t, float64(2025), majors[0]["cohort_year"])
		reqs := majors[0]["requirements"].([]interface{})
		assert.Len(t, reqs, 1)
	})

	t.Run("invalid cohort returns bad request", func(t *testing.T) {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/api/v1/majors/abc", nil)
		router.ServeHTTP(w, req)
		assert.Equal(t, 400, w.Code)
	})
}

func TestGetGraphDataEmpty(t *testing.T) {
	router := setupRouterRoot(t, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/graph/data", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Empty(t, resp["nodes"])
	assert.Empty(t, resp["edges"])
}

func TestGetGraphDataWithData(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		c1 := interfaces.CourseData{ID: uuid.New(), Title: "A", AvailableSemesters: []int{1}, Workload: 3.0}
		c2 := interfaces.CourseData{ID: uuid.New(), Title: "B", AvailableSemesters: []int{1}, Workload: 3.0}
		s.CreateCourse(c1)
		s.CreateCourse(c2)
		s.CreateCourseDependency(interfaces.CourseDependencyData{ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: c1.ID, DependencyType: enums.DependencyTypePrerequisite})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/graph/data", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Len(t, resp["nodes"], 2)
	assert.Len(t, resp["edges"], 1)
}

func TestIdentifyMajor(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		m1 := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech", CohortYear: 2025}
		m2 := interfaces.MajorData{ID: uuid.New(), Title: "AI", School: "Tech", CohortYear: 2024}
		s.CreateMajor(m1)
		s.CreateMajor(m2)

		c1 := interfaces.CourseData{ID: uuid.New(), Title: "A", AvailableSemesters: []int{1}, Workload: 3.0}
		c2 := interfaces.CourseData{ID: uuid.New(), Title: "B", AvailableSemesters: []int{1}, Workload: 3.0}
		c3 := interfaces.CourseData{ID: uuid.New(), Title: "C", AvailableSemesters: []int{1}, Workload: 3.0}
		s.CreateCourse(c1)
		s.CreateCourse(c2)
		s.CreateCourse(c3)

		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: m1.ID, CourseID: c1.ID, RequirementType: enums.RequirementTypeMajorCore})
		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: m1.ID, CourseID: c2.ID, RequirementType: enums.RequirementTypeMajorCore})
		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: m2.ID, CourseID: c1.ID, RequirementType: enums.RequirementTypeMajorCore})
	})

	body := `["` + getCourseID(router, t) + `"]`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/majors/identify", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var analysis []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &analysis)
	assert.NotZero(t, len(analysis))
}

func TestIdentifyMajorWithCohortYear(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		m1 := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech", CohortYear: 2025}
		m2 := interfaces.MajorData{ID: uuid.New(), Title: "AI", School: "Tech", CohortYear: 2024}
		s.CreateMajor(m1)
		s.CreateMajor(m2)

		c1 := interfaces.CourseData{ID: uuid.New(), Title: "Common", AllowedCohorts: []int{2025}, AvailableSemesters: []int{1}, Workload: 3.0}
		c2 := interfaces.CourseData{ID: uuid.New(), Title: "Old", AllowedCohorts: []int{2024}, AvailableSemesters: []int{1}, Workload: 3.0}
		c3 := interfaces.CourseData{ID: uuid.New(), Title: "Advanced", AllowedCohorts: []int{2025}, AvailableSemesters: []int{2}, Workload: 3.0}
		s.CreateCourse(c1)
		s.CreateCourse(c2)
		s.CreateCourse(c3)

		// c3 requires c1
		s.CreateCourseDependency(interfaces.CourseDependencyData{
			ID:               uuid.New(),
			CourseID:         c3.ID,
			RequiredCourseID: c1.ID,
			DependencyType:   enums.DependencyTypePrerequisite,
		})

		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: m1.ID, CourseID: c1.ID, RequirementType: enums.RequirementTypeMajorCore})
		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: m1.ID, CourseID: c2.ID, RequirementType: enums.RequirementTypeMajorCore})
		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: m1.ID, CourseID: c3.ID, RequirementType: enums.RequirementTypeMajorCore})
		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: m2.ID, CourseID: c2.ID, RequirementType: enums.RequirementTypeMajorCore})
	})

	courses := getCoursesList(router, t)
	commonID := findCourseByTitle(courses, "Common")["id"].(string)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/majors/identify/2025", strings.NewReader(`["`+commonID+`"]`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var analysis []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &analysis)
	assert.Len(t, analysis, 1)
	assert.Equal(t, "SE", analysis[0]["title"])
	assert.Equal(t, float64(2025), analysis[0]["cohort_year"])

	// We passed 'Common' (c1).
	// Total requirements for SE 2025: c1, c2, c3 (3)
	// Covered: c1 (1)
	// Score: 1 / 3 = 0.333...
	// Can Cover: c2 is not allowed for the 2025 cohort -> 0
	//            c3 requires c1, and we passed c1, and it is offered in a future semester -> 1
	// So Can Cover = 1
	assert.InDelta(t, 0.333, analysis[0]["score"].(float64), 0.01)
	assert.Equal(t, float64(1), analysis[0]["covered_count"])
	assert.Equal(t, float64(1), analysis[0]["can_cover_count"])
	assert.Equal(t, float64(3), analysis[0]["total_count"])
}

func TestIdentifyMajorCanCoverRespectsRemainingOfferings(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		m1 := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech", CohortYear: 2025}
		s.CreateMajor(m1)

		c1 := interfaces.CourseData{ID: uuid.New(), Title: "Capstone", AllowedCohorts: []int{2025}, AvailableSemesters: []int{7}, Workload: 3.0}
		s.CreateCourse(c1)
		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: m1.ID, CourseID: c1.ID, RequirementType: enums.RequirementTypeMajorCore})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/majors/identify/2025", strings.NewReader(`{"passed_course_ids":[],"current_semester":8}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var analysis []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &analysis)
	assert.Len(t, analysis, 1)
	assert.Equal(t, float64(0), analysis[0]["covered_count"])
	assert.Equal(t, float64(0), analysis[0]["can_cover_count"])
	assert.Equal(t, float64(1), analysis[0]["total_count"])
}

func TestIdentifySpecializationsReturnsPlainSpecializationTitle(t *testing.T) {
	majorID := uuid.New()
	specID := uuid.New()
	courseID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		s.CreateMajor(interfaces.MajorData{ID: majorID, Title: "SE", School: "Tech", CohortYear: 2025})
		s.CreateSpecialization(interfaces.SpecializationData{ID: specID, MajorID: majorID, Title: "AI"})
		s.CreateCourse(interfaces.CourseData{ID: courseID, Title: "Intro AI", AvailableSemesters: []int{1}, Workload: 3.0})
		s.CreateMajorRequirement(interfaces.MajorRequirementData{
			ID:              uuid.New(),
			MajorID:         majorID,
			CourseID:        courseID,
			RequirementType: enums.RequirementTypeMajorChoice,
			Specializations: []string{"AI"},
		})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/majors/identify-specializations/2025", strings.NewReader(`[]`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var analysis []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &analysis)
	assert.Len(t, analysis, 1)
	assert.Equal(t, "AI", analysis[0]["title"])
	assert.Equal(t, majorID.String(), analysis[0]["major_id"])
}

func TestIdentifySpecializationsCanFilterByMajorID(t *testing.T) {
	majorOneID := uuid.New()
	majorTwoID := uuid.New()
	courseOneID := uuid.New()
	courseTwoID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		s.CreateMajor(interfaces.MajorData{ID: majorOneID, Title: "SE", School: "Tech", CohortYear: 2025})
		s.CreateMajor(interfaces.MajorData{ID: majorTwoID, Title: "DS", School: "Tech", CohortYear: 2025})
		s.CreateSpecialization(interfaces.SpecializationData{ID: uuid.New(), MajorID: majorOneID, Title: "AI"})
		s.CreateSpecialization(interfaces.SpecializationData{ID: uuid.New(), MajorID: majorTwoID, Title: "ML"})
		s.CreateCourse(interfaces.CourseData{ID: courseOneID, Title: "Intro AI", AvailableSemesters: []int{1}, Workload: 3.0})
		s.CreateCourse(interfaces.CourseData{ID: courseTwoID, Title: "Intro ML", AvailableSemesters: []int{1}, Workload: 3.0})
		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: majorOneID, CourseID: courseOneID, RequirementType: enums.RequirementTypeMajorChoice, Specializations: []string{"AI"}})
		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: majorTwoID, CourseID: courseTwoID, RequirementType: enums.RequirementTypeMajorChoice, Specializations: []string{"ML"}})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/majors/identify-specializations/2025", strings.NewReader(`{"passed_course_ids":[],"major_id":"`+majorOneID.String()+`"}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var analysis []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &analysis)
	assert.Len(t, analysis, 1)
	assert.Equal(t, majorOneID.String(), analysis[0]["major_id"])
	assert.Equal(t, "AI", analysis[0]["title"])
}

func findCourseByTitle(courses []map[string]interface{}, title string) map[string]interface{} {
	for _, c := range courses {
		if c["title"] == title {
			return c
		}
	}
	return nil
}

func getCourseID(router *gin.Engine, t *testing.T) string {
	t.Helper()
	courses := getCoursesList(router, t)
	if len(courses) > 0 {
		return courses[0]["id"].(string)
	}
	return ""
}

func TestPlannerGenerate(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		m := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech"}
		s.CreateMajor(m)
		c := interfaces.CourseData{ID: uuid.New(), Title: "Python", AvailableSemesters: []int{1, 2}, Workload: 4.0}
		s.CreateCourse(c)
		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: m.ID, CourseID: c.ID, RequirementType: enums.RequirementTypeMajorCore})
	})

	courses := getCoursesList(router, t)
	assert.NotZero(t, len(courses))

	majors := getMajorsList(router, t)
	assert.NotZero(t, len(majors))

	body := `{"passed_course_ids":[],"major_id":"` + majors[0]["id"].(string) + `","current_semester":1,"max_load":12.0}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/planner/generate", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, majors[0]["id"].(string), resp["major_id"])
	roadmap, ok := resp["roadmap"].([]interface{})
	assert.True(t, ok)
	assert.NotEmpty(t, roadmap)
	semester, ok := roadmap[0].(map[string]interface{})
	assert.True(t, ok)
	_, hasCourseIDs := semester["course_ids"]
	assert.True(t, hasCourseIDs)
}

func getCoursesList(router *gin.Engine, t *testing.T) []map[string]interface{} {
	t.Helper()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/courses/", nil)
	router.ServeHTTP(w, req)
	var courses []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &courses)
	return courses
}

func getMajorsList(router *gin.Engine, t *testing.T) []map[string]interface{} {
	t.Helper()
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/majors/", nil)
	router.ServeHTTP(w, req)
	var majors []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &majors)
	return majors
}

func TestPlannerGenerateBadRequest(t *testing.T) {
	router := setupRouterRoot(t, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/planner/generate", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 400, w.Code)
}

func TestPlannerValidateSemester(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		c1 := interfaces.CourseData{ID: uuid.New(), Title: "A", AvailableSemesters: []int{1}, Workload: 4.0, Category: enums.CourseCategorySTEM}
		c2 := interfaces.CourseData{ID: uuid.New(), Title: "B", AvailableSemesters: []int{2}, Workload: 5.0, Category: enums.CourseCategorySTEM}
		s.CreateCourse(c1)
		s.CreateCourse(c2)
		s.CreateCourseDependency(interfaces.CourseDependencyData{ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: c1.ID, DependencyType: enums.DependencyTypePrerequisite})
	})

	courses := getCoursesList(router, t)
	assert.Len(t, courses, 2)

	courseA := findCourseByTitle(courses, "A")
	body := `{"current_semester":1,"course_ids":["` + courseA["id"].(string) + `"],"passed_course_ids":[],"max_load":12.0}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/planner/validate-semester/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var result map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &result)
	assert.True(t, result["is_valid"].(bool))
}

func TestPlannerValidateSemesterWorkloadExceeded(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		c1 := interfaces.CourseData{ID: uuid.New(), Title: "A", AvailableSemesters: []int{1}, Workload: 6.0, Category: enums.CourseCategorySTEM}
		c2 := interfaces.CourseData{ID: uuid.New(), Title: "B", AvailableSemesters: []int{1}, Workload: 7.0}
		s.CreateCourse(c1)
		s.CreateCourse(c2)
	})

	courses := getCoursesList(router, t)

	body := `{"current_semester":1,"course_ids":["` + courses[0]["id"].(string) + `","` + courses[1]["id"].(string) + `"],"passed_course_ids":[],"max_load":8.0}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/planner/validate-semester/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var result map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &result)
	assert.True(t, result["is_valid"].(bool))
	assert.InDelta(t, 13.0, result["total_load"].(float64), 0.01)
}

func TestPlannerGoalPath(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		c1 := interfaces.CourseData{ID: uuid.New(), Title: "Python", AvailableSemesters: []int{1, 2}, Workload: 4.0}
		c2 := interfaces.CourseData{ID: uuid.New(), Title: "Advanced", AvailableSemesters: []int{3, 4}, Workload: 5.0}
		s.CreateCourse(c1)
		s.CreateCourse(c2)
		s.CreateCourseDependency(interfaces.CourseDependencyData{ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: c1.ID, DependencyType: enums.DependencyTypePrerequisite})
	})

	courses := getCoursesList(router, t)
	assert.Len(t, courses, 2)

	targetID := ""
	for _, c := range courses {
		if c["title"] == "Advanced" {
			targetID = c["id"].(string)
			break
		}
	}
	assert.NotZero(t, targetID)

	body := `{"target_course_id":"` + targetID + `","passed_course_ids":[],"current_semester":1,"max_load":12.0}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/planner/goal-path/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NotNil(t, resp["roadmap"])
}

func TestPlannerGoalPathBadRequest(t *testing.T) {
	router := setupRouterRoot(t, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/planner/goal-path/", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 400, w.Code)
}

func TestStoreNotInitialized(t *testing.T) {
	store.CloseStore()

	router := gin.New()
	router.GET("/api/v1/courses/", getCourses)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/courses/", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 503, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "store not initialized")

	store.CloseStore()
	_, err := store.InitStore(true, "", "admin", true, "")
	assert.NoError(t, err)
}

func TestGetGraphDataWithRecommendedSemester(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		c := interfaces.CourseData{
			ID:                  uuid.New(),
			Title:               "Algo",
			Category:            enums.CourseCategorySTEM,
			AvailableSemesters:  []int{1, 3},
			RecommendedSemester: new(2),
			Workload:            5.0,
		}
		s.CreateCourse(c)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/graph/data", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	nodes := resp["nodes"].([]interface{})
	assert.Len(t, nodes, 1)
	node := nodes[0].(map[string]interface{})
	assert.Equal(t, float64(2), node["recommended_semester"])
	assert.Equal(t, "stem", node["group"])
}

func addAuthCookie(t *testing.T, req *http.Request) {
	t.Helper()
	s := store.GetStore()
	assert.NotNil(t, s)
	cache := store.GetCacheStore()
	assert.NotNil(t, cache)
	token, err := cache.CreateAuthToken()
	assert.NoError(t, err)
	req.AddCookie(&http.Cookie{Name: "auth-token", Value: token.Token.String()})
}

func TestCreateCourseAdmin(t *testing.T) {
	router := setupRouterRoot(t, nil)

	body := `{"title":"New Course","course_type":"mandatory","category":"tech","workload":5.0}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/courses/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	addAuthCookie(t, req)
	router.ServeHTTP(w, req)

	assert.Equal(t, 201, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NotNil(t, resp["id"])
}

func TestUpdateCourseAdmin(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		c := interfaces.CourseData{ID: uuid.New(), Title: "Old", Category: enums.CourseCategoryTech}
		s.CreateCourse(c)
	})

	courses := getCoursesList(router, t)
	assert.Len(t, courses, 1)
	courseID := courses[0]["id"].(string)

	body := `{"title":"Updated Course","course_type":"mandatory","category":"tech","workload":6.0}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/courses/"+courseID, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	addAuthCookie(t, req)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	// Verify
	coursesAfter := getCoursesList(router, t)
	assert.Equal(t, "Updated Course", coursesAfter[0]["title"])
}

func TestDeleteCourseAdmin(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		c := interfaces.CourseData{ID: uuid.New(), Title: "To Delete"}
		s.CreateCourse(c)
	})

	courses := getCoursesList(router, t)
	assert.Len(t, courses, 1)
	courseID := courses[0]["id"].(string)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/v1/courses/"+courseID, nil)
	addAuthCookie(t, req)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	coursesAfter := getCoursesList(router, t)
	assert.Len(t, coursesAfter, 0)
}

func TestUpdateMajorAdmin(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		m := interfaces.MajorData{ID: uuid.New(), Title: "Old Major", School: "Tech"}
		s.CreateMajor(m)
		c := interfaces.CourseData{ID: uuid.New(), Title: "Course"}
		s.CreateCourse(c)
	})

	majors := getMajorsList(router, t)
	assert.Len(t, majors, 1)
	majorID := majors[0]["id"].(string)

	courses := getCoursesList(router, t)
	courseID := courses[0]["id"].(string)

	body := `{"title":"Updated Major","school":"New School","requirements":[{"course_id":"` + courseID + `","type":"major_core"}]}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/majors/"+majorID, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	addAuthCookie(t, req)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	// Verify
	majorsAfter := getMajorsList(router, t)
	assert.Equal(t, "Updated Major", majorsAfter[0]["title"])
	assert.Equal(t, "New School", majorsAfter[0]["school"])
	reqs := majorsAfter[0]["requirements"].([]interface{})
	assert.Len(t, reqs, 1)
}

func TestAdminUnauthorized(t *testing.T) {
	router := setupRouterRoot(t, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/courses/", strings.NewReader(`{}`))
	// No token
	router.ServeHTTP(w, req)

	assert.Equal(t, 401, w.Code)
}

func TestValidateRoadmapNoMaxLoad(t *testing.T) {
	router := setupRouterRoot(t, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/planner/validate-roadmap/", strings.NewReader(`{
  "roadmap": [
    {
      "semester": 0,
      "course_ids": []
    }
  ],
  "current_semester": 1
}`))
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
}
