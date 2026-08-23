package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/requirements"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/cu-3rd-party/cu-roadmap/backend/store"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func addRequirement(t testing.TB, s interfaces.StoreBase, majorID, courseID uuid.UUID, reqType enums.RequirementType, specs ...string) {
	t.Helper()
	assert.NoError(t, requirements.AddFlatRequirement(s, majorID, requirements.FlatRequirementInput{
		ID:              uuid.New(),
		CourseID:        courseID,
		RequirementType: reqType,
		Specializations: specs,
	}))
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
	RegisterDisciplineGroupRoutes(apiV1.Group("/discipline-groups"))
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
	RegisterDisciplineGroupRoutes(apiV1.Group("/discipline-groups"))
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
			RequiredCourseID: &baseID,
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
	prereqGroupsRaw, ok := byID[advancedID.String()]["prerequisites"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, prereqGroupsRaw, 1)
	group := prereqGroupsRaw[0].(map[string]interface{})
	assert.Equal(t, float64(0), group["group_id"])
	courseIDsRaw := group["course_ids"].([]interface{})
	assert.ElementsMatch(t, []interface{}{baseID.String()}, courseIDsRaw)
	assert.Empty(t, byID[advancedID.String()]["postrequisites"])
}

func TestGetCoursesReturnsPrerequisiteGroups(t *testing.T) {
	baseID := uuid.New()
	alternativeID := uuid.New()
	alternativeID2 := uuid.New()
	advancedID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		_, _ = s.CreateCourse(interfaces.CourseData{ID: baseID, Title: "Base", AvailableSemesters: []int{1}, Workload: 3.0})
		_, _ = s.CreateCourse(interfaces.CourseData{ID: alternativeID, Title: "Alt 1", AvailableSemesters: []int{1}, Workload: 3.0})
		_, _ = s.CreateCourse(interfaces.CourseData{ID: alternativeID2, Title: "Alt 2", AvailableSemesters: []int{1}, Workload: 3.0})
		_, _ = s.CreateCourse(interfaces.CourseData{ID: advancedID, Title: "Advanced", AvailableSemesters: []int{2}, Workload: 4.0})
		_, _ = s.CreateCourseDependency(interfaces.CourseDependencyData{
			ID:               uuid.New(),
			CourseID:         advancedID,
			RequiredCourseID: &baseID,
			DependencyType:   enums.DependencyTypePrerequisite,
			AlternativeGroup: 42,
		})
		_, _ = s.CreateCourseDependency(interfaces.CourseDependencyData{
			ID:               uuid.New(),
			CourseID:         advancedID,
			RequiredCourseID: &alternativeID,
			DependencyType:   enums.DependencyTypePrerequisite,
			AlternativeGroup: 99,
		})
		_, _ = s.CreateCourseDependency(interfaces.CourseDependencyData{
			ID:               uuid.New(),
			CourseID:         advancedID,
			RequiredCourseID: &alternativeID2,
			DependencyType:   enums.DependencyTypePrerequisite,
			AlternativeGroup: 99,
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

	prereqGroupsRaw, ok := byID[advancedID.String()]["prerequisites"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, prereqGroupsRaw, 2)

	groups := make(map[int][]string)
	for _, rawGroup := range prereqGroupsRaw {
		group := rawGroup.(map[string]interface{})
		groupID := int(group["group_id"].(float64))
		courseIDsRaw := group["course_ids"].([]interface{})
		courseIDs := make([]string, 0, len(courseIDsRaw))
		for _, rawCourseID := range courseIDsRaw {
			courseIDs = append(courseIDs, rawCourseID.(string))
		}
		groups[groupID] = courseIDs
	}

	assert.Equal(t, []string{baseID.String()}, groups[0])
	assert.Equal(t, []string{alternativeID.String(), alternativeID2.String()}, groups[1])
	assert.Equal(t, 2, len(groups))
}

func TestGetCoursesReturnsFixedSemesterForMandatoryAnalogGroup(t *testing.T) {
	courseID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		_, _ = s.CreateCourse(interfaces.CourseData{
			ID:                 courseID,
			Title:              "Mandatory Fundamentals",
			AvailableSemesters: []int{4},
			Workload:           3.0,
			AnalogGroup:        "ОБЯЗ:",
		})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/courses/", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	var courses []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &courses)

	var course map[string]interface{}
	for _, item := range courses {
		if item["id"] == courseID.String() {
			course = item
			break
		}
	}

	assert.NotNil(t, course)
	assert.Equal(t, float64(4), course["fixed_semester"])
}

func TestGetCoursesReturnsZeroFixedSemesterWhenAnalogGroupHasMultipleCourses(t *testing.T) {
	courseID := uuid.New()
	otherCourseID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		_, _ = s.CreateCourse(interfaces.CourseData{
			ID:                 courseID,
			Title:              "Mandatory Fundamentals",
			AvailableSemesters: []int{4},
			Workload:           3.0,
			AnalogGroup:        "ОБЯЗ:",
		})
		_, _ = s.CreateCourse(interfaces.CourseData{
			ID:                 otherCourseID,
			Title:              "Another Mandatory Fundamentals",
			AvailableSemesters: []int{5},
			Workload:           3.0,
			AnalogGroup:        "ОБЯЗ:",
		})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/courses/", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	var courses []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &courses)

	var course map[string]interface{}
	for _, item := range courses {
		if item["id"] == courseID.String() {
			course = item
			break
		}
	}

	assert.NotNil(t, course)
	assert.Equal(t, float64(0), course["fixed_semester"])
}

func TestGetCoursesReturnsSpecializations(t *testing.T) {
	majorID := uuid.New()
	specID := uuid.New()
	courseID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		_, _ = s.CreateMajor(interfaces.MajorData{ID: majorID, Title: "SE", School: "Tech"})
		_, _ = s.CreateSpecialization(interfaces.SpecializationData{ID: specID, MajorID: majorID, Title: "Web"})
		_, _ = s.CreateCourse(interfaces.CourseData{ID: courseID, Title: "Web Basics", AvailableSemesters: []int{1}, Workload: 3.0})
		addRequirement(t, s, majorID, courseID, enums.RequirementTypeMajorChoice, "Web")
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

func TestGetCoursesWithMajorPathReturnsByMajorTypeAndSpecializations(t *testing.T) {
	majorID := uuid.New()
	specID := uuid.New()
	coreCourseID := uuid.New()
	choiceCourseID := uuid.New()
	electiveCourseID := uuid.New()
	fundamentalsCourseID := uuid.New()
	flexCourseID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		_, _ = s.CreateMajor(interfaces.MajorData{ID: majorID, Title: "Разработка", School: "Tech"})
		_, _ = s.CreateSpecialization(interfaces.SpecializationData{ID: specID, MajorID: majorID, Title: "Web"})
		_, _ = s.CreateCourse(interfaces.CourseData{ID: coreCourseID, Title: "Core Course", AvailableSemesters: []int{1}, Workload: 3.0, Category: enums.CourseCategoryTech, CourseType: enums.CourseTypeMandatory})
		_, _ = s.CreateCourse(interfaces.CourseData{ID: choiceCourseID, Title: "Choice Course", AvailableSemesters: []int{1}, Workload: 3.0, Category: enums.CourseCategoryAI, CourseType: enums.CourseTypeElective})
		_, _ = s.CreateCourse(interfaces.CourseData{ID: electiveCourseID, Title: "Elective Course", AvailableSemesters: []int{1}, Workload: 3.0, Category: enums.CourseCategoryBusiness, CourseType: enums.CourseTypeElective})
		_, _ = s.CreateCourse(interfaces.CourseData{ID: fundamentalsCourseID, Title: "Fundamentals Course", AvailableSemesters: []int{1}, Workload: 3.0, Category: enums.CourseCategoryFundamentals, CourseType: enums.CourseTypeMandatory})
		_, _ = s.CreateCourse(interfaces.CourseData{ID: flexCourseID, Title: "STEM Flex Course", AvailableSemesters: []int{1}, Workload: 3.0, Category: enums.CourseCategorySTEM, CourseType: enums.CourseTypeOther})
		addRequirement(t, s, majorID, coreCourseID, enums.RequirementTypeMajorCore, "Web")
		addRequirement(t, s, majorID, choiceCourseID, enums.RequirementTypeMajorChoice, "Web")
		addRequirement(t, s, majorID, fundamentalsCourseID, enums.RequirementTypeMajorCore)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/courses/2025/"+majorID.String(), nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	var courses []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &courses)

	findCourse := func(title string) map[string]interface{} {
		for _, course := range courses {
			if course["title"] == title {
				return course
			}
		}
		return nil
	}

	coreCourse := findCourse("Core Course")
	assert.NotNil(t, coreCourse)
	assert.Equal(t, "core", coreCourse["by_major_type"])
	assert.Equal(t, "swe", coreCourse["category"])
	specializations, ok := coreCourse["specializations"].([]interface{})
	assert.True(t, ok)
	assert.ElementsMatch(t, []interface{}{specID.String()}, specializations)

	choiceCourse := findCourse("Choice Course")
	assert.NotNil(t, choiceCourse)
	assert.Equal(t, "choice", choiceCourse["by_major_type"])
	assert.Equal(t, "swe", choiceCourse["category"])

	electiveCourse := findCourse("Elective Course")
	assert.NotNil(t, electiveCourse)
	assert.Equal(t, "elective", electiveCourse["by_major_type"])
	assert.Equal(t, "business", electiveCourse["category"])

	fundamentalsCourse := findCourse("Fundamentals Course")
	assert.NotNil(t, fundamentalsCourse)
	assert.Equal(t, "other", fundamentalsCourse["by_major_type"])
	assert.Equal(t, "other", fundamentalsCourse["course_type"])
	assert.Equal(t, "fundamentals", fundamentalsCourse["category"])

	flexCourse := findCourse("STEM Flex Course")
	assert.NotNil(t, flexCourse)
	assert.Equal(t, "flex", flexCourse["by_major_type"])
	assert.Equal(t, "flex", flexCourse["course_type"])
	assert.Equal(t, "stem", flexCourse["category"])
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
		addRequirement(t, s, m.ID, c.ID, enums.RequirementTypeMajorCore)
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

func TestGetMajorsReturnsInternalNameForKnownMajors(t *testing.T) {
	tests := []struct {
		name         string
		title        string
		expectedName string
	}{
		{name: "ai", title: "Искусственный интеллект", expectedName: "ai"},
		{name: "swe", title: "Разработка", expectedName: "swe"},
		{name: "business", title: "Бизнес и аналитика", expectedName: "business"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			router := setupRouterRoot(t, func(s interfaces.StoreBase) {
				m := interfaces.MajorData{ID: uuid.New(), Title: tc.title, School: "Tech"}
				s.CreateMajor(m)
			})

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/api/v1/majors/", nil)
			router.ServeHTTP(w, req)

			assert.Equal(t, 200, w.Code)
			var majors []map[string]interface{}
			json.Unmarshal(w.Body.Bytes(), &majors)
			assert.Len(t, majors, 1)
			assert.Equal(t, tc.expectedName, majors[0]["internal_name"])
		})
	}
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
		addRequirement(t, s, m2025.ID, c1.ID, enums.RequirementTypeMajorCore)
		addRequirement(t, s, m2026.ID, c2.ID, enums.RequirementTypeMajorCore)
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
		s.CreateCourseDependency(interfaces.CourseDependencyData{ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: &c1.ID, DependencyType: enums.DependencyTypePrerequisite})
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

		addRequirement(t, s, m1.ID, c1.ID, enums.RequirementTypeMajorCore)
		addRequirement(t, s, m1.ID, c2.ID, enums.RequirementTypeMajorCore)
		addRequirement(t, s, m2.ID, c1.ID, enums.RequirementTypeMajorCore)
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
			RequiredCourseID: &c1.ID,
			DependencyType:   enums.DependencyTypePrerequisite,
		})

		addRequirement(t, s, m1.ID, c1.ID, enums.RequirementTypeMajorCore)
		addRequirement(t, s, m1.ID, c2.ID, enums.RequirementTypeMajorCore)
		addRequirement(t, s, m1.ID, c3.ID, enums.RequirementTypeMajorCore)
		addRequirement(t, s, m2.ID, c2.ID, enums.RequirementTypeMajorCore)
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
		addRequirement(t, s, m1.ID, c1.ID, enums.RequirementTypeMajorCore)
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
		addRequirement(t, s, majorID, courseID, enums.RequirementTypeMajorChoice, "AI")
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
		addRequirement(t, s, majorOneID, courseOneID, enums.RequirementTypeMajorChoice, "AI")
		addRequirement(t, s, majorTwoID, courseTwoID, enums.RequirementTypeMajorChoice, "ML")
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

func TestIdentifySpecializationsCountsOnlyChoiceRequirements(t *testing.T) {
	majorID := uuid.New()
	specID := uuid.New()
	coreCourseID := uuid.New()
	choiceCourseID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		s.CreateMajor(interfaces.MajorData{ID: majorID, Title: "SE", School: "Tech", CohortYear: 2025})
		s.CreateSpecialization(interfaces.SpecializationData{ID: specID, MajorID: majorID, Title: "AI"})
		s.CreateCourse(interfaces.CourseData{ID: coreCourseID, Title: "Core Course", AvailableSemesters: []int{1}, Workload: 3.0})
		s.CreateCourse(interfaces.CourseData{ID: choiceCourseID, Title: "Choice Course", AvailableSemesters: []int{1}, Workload: 3.0})
		addRequirement(t, s, majorID, coreCourseID, enums.RequirementTypeMajorCore, "AI")
		addRequirement(t, s, majorID, choiceCourseID, enums.RequirementTypeMajorChoice, "AI")
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/majors/identify-specializations/2025", strings.NewReader(`{"passed_course_ids":["`+choiceCourseID.String()+`"]}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var analysis []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &analysis)
	assert.Len(t, analysis, 2)
	// Core card (Обязательные дисциплины) is always sorted first and has is_core: true
	assert.Equal(t, "Обязательные дисциплины", analysis[0]["title"])
	assert.Equal(t, true, analysis[0]["is_core"])
	assert.Equal(t, float64(0), analysis[0]["covered_count"])
	assert.Equal(t, float64(1), analysis[0]["can_cover_count"])
	assert.Equal(t, float64(1), analysis[0]["total_count"])
	canCoverIDs, ok := analysis[0]["can_cover_ids"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, canCoverIDs, 1)
	assert.Equal(t, coreCourseID.String(), canCoverIDs[0])

	// Choice card (AI) is sorted second and has is_core: false
	assert.Equal(t, "AI", analysis[1]["title"])
	assert.Equal(t, false, analysis[1]["is_core"])
	assert.Equal(t, float64(1), analysis[1]["covered_count"])
	assert.Equal(t, float64(0), analysis[1]["can_cover_count"])
	assert.Equal(t, float64(1), analysis[1]["total_count"])
	completedIDs, ok := analysis[1]["completed_ids"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, completedIDs, 1)
	assert.Equal(t, choiceCourseID.String(), completedIDs[0])
}

func TestIdentifySpecializationsIgnoresUnscopedChoiceRequirements(t *testing.T) {
	majorID := uuid.New()
	specID := uuid.New()
	scopedCourseID := uuid.New()
	unscopedCourseID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		s.CreateMajor(interfaces.MajorData{ID: majorID, Title: "SE", School: "Tech", CohortYear: 2025})
		s.CreateSpecialization(interfaces.SpecializationData{ID: specID, MajorID: majorID, Title: "AI"})
		s.CreateCourse(interfaces.CourseData{ID: scopedCourseID, Title: "Scoped Choice", AvailableSemesters: []int{1}, Workload: 3.0})
		s.CreateCourse(interfaces.CourseData{ID: unscopedCourseID, Title: "Global Choice", AvailableSemesters: []int{1}, Workload: 3.0})
		addRequirement(t, s, majorID, scopedCourseID, enums.RequirementTypeMajorChoice, "AI")
		addRequirement(t, s, majorID, unscopedCourseID, enums.RequirementTypeMajorChoice)
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/majors/identify-specializations/2025", strings.NewReader(`[]`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var analysis []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &analysis)
	assert.Len(t, analysis, 1)
	assert.Equal(t, float64(1), analysis[0]["total_count"])
	assert.Equal(t, float64(0), analysis[0]["covered_count"])
	assert.Equal(t, "AI", analysis[0]["title"])
}

func TestIdentifySpecializationsTreatsCurrentSemesterAsFlexibleStart(t *testing.T) {
	majorID := uuid.New()
	specID := uuid.New()
	courseID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		s.CreateMajor(interfaces.MajorData{ID: majorID, Title: "SE", School: "Tech", CohortYear: 2025})
		s.CreateSpecialization(interfaces.SpecializationData{ID: specID, MajorID: majorID, Title: "AI"})
		s.CreateCourse(interfaces.CourseData{ID: courseID, Title: "Early Course", AvailableSemesters: []int{1}, Workload: 3.0})
		addRequirement(t, s, majorID, courseID, enums.RequirementTypeMajorChoice, "AI")
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/majors/identify-specializations/2025", strings.NewReader(`{"passed_course_ids":[],"current_semester":3}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var analysis []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &analysis)
	assert.Len(t, analysis, 1)
	assert.Equal(t, float64(1), analysis[0]["can_cover_count"])
	assert.Equal(t, float64(0), analysis[0]["covered_count"])
	assert.Equal(t, float64(1), analysis[0]["total_count"])
}

func TestIdentifySpecializationsResetsCurrentSemesterWhenPassedCoursesAreEmpty(t *testing.T) {
	majorID := uuid.New()
	specID := uuid.New()
	courseID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		s.CreateMajor(interfaces.MajorData{ID: majorID, Title: "SE", School: "Tech", CohortYear: 2025})
		s.CreateSpecialization(interfaces.SpecializationData{ID: specID, MajorID: majorID, Title: "AI"})
		s.CreateCourse(interfaces.CourseData{ID: courseID, Title: "Early Course", AvailableSemesters: []int{1}, Workload: 3.0})
		addRequirement(t, s, majorID, courseID, enums.RequirementTypeMajorChoice, "AI")
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/majors/identify-specializations/2025", strings.NewReader(`{"passed_course_ids":[],"current_semester":5}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var analysis []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &analysis)
	assert.Len(t, analysis, 1)
	assert.Equal(t, float64(1), analysis[0]["can_cover_count"])
	assert.Equal(t, float64(0), analysis[0]["covered_count"])
}

func TestIdentifySpecializationsTreatsPrereqAndCoreqPairAsSameSemesterOption(t *testing.T) {
	majorID := uuid.New()
	specID := uuid.New()
	baseCourseID := uuid.New()
	dependentCourseID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		s.CreateMajor(interfaces.MajorData{ID: majorID, Title: "SE", School: "Tech", CohortYear: 2025})
		s.CreateSpecialization(interfaces.SpecializationData{ID: specID, MajorID: majorID, Title: "AI"})
		s.CreateCourse(interfaces.CourseData{ID: baseCourseID, Title: "Base Course", AvailableSemesters: []int{1}, Workload: 3.0})
		s.CreateCourse(interfaces.CourseData{ID: dependentCourseID, Title: "Dependent Course", AvailableSemesters: []int{1}, Workload: 3.0})
		addRequirement(t, s, majorID, dependentCourseID, enums.RequirementTypeMajorChoice, "AI")
		s.CreateCourseDependency(interfaces.CourseDependencyData{
			ID:               uuid.New(),
			CourseID:         dependentCourseID,
			RequiredCourseID: &baseCourseID,
			DependencyType:   enums.DependencyTypePrerequisite,
		})
		s.CreateCourseDependency(interfaces.CourseDependencyData{
			ID:               uuid.New(),
			CourseID:         dependentCourseID,
			RequiredCourseID: &baseCourseID,
			DependencyType:   enums.DependencyTypeCorequisite,
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
	assert.Equal(t, float64(0), analysis[0]["covered_count"])
	assert.Equal(t, float64(1), analysis[0]["can_cover_count"])
	assert.Equal(t, float64(1), analysis[0]["total_count"])
}

func TestIdentifySpecializationsCollapsesAnalogGroupRequirements(t *testing.T) {
	majorID := uuid.New()
	specID := uuid.New()
	firstCourseID := uuid.New()
	secondCourseID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		s.CreateMajor(interfaces.MajorData{ID: majorID, Title: "SE", School: "Tech", CohortYear: 2025})
		s.CreateSpecialization(interfaces.SpecializationData{ID: specID, MajorID: majorID, Title: "AI"})
		s.CreateCourse(interfaces.CourseData{ID: firstCourseID, Title: "First Analog Choice", AnalogGroup: "GROUP1", AvailableSemesters: []int{1}, Workload: 3.0})
		s.CreateCourse(interfaces.CourseData{ID: secondCourseID, Title: "Second Analog Choice", AnalogGroup: "GROUP1", AvailableSemesters: []int{1}, Workload: 3.0})
		addRequirement(t, s, majorID, firstCourseID, enums.RequirementTypeMajorChoice, "AI")
		addRequirement(t, s, majorID, secondCourseID, enums.RequirementTypeMajorChoice, "AI")
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/majors/identify-specializations/2025", strings.NewReader(`[]`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var analysis []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &analysis)
	assert.Len(t, analysis, 1)
	assert.Equal(t, float64(1), analysis[0]["total_count"])
	assert.Equal(t, float64(0), analysis[0]["covered_count"])
	assert.Equal(t, float64(1), analysis[0]["can_cover_count"])
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
		addRequirement(t, s, m.ID, c.ID, enums.RequirementTypeMajorCore)
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
		s.CreateCourseDependency(interfaces.CourseDependencyData{ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: &c1.ID, DependencyType: enums.DependencyTypePrerequisite})
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
		s.CreateCourseDependency(interfaces.CourseDependencyData{ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: &c1.ID, DependencyType: enums.DependencyTypePrerequisite})
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

func TestGetCourseByID(t *testing.T) {
	courseID := uuid.New()
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		s.CreateCourse(interfaces.CourseData{
			ID:                 courseID,
			Title:              "Линейная алгебра",
			Category:           enums.CourseCategoryTech,
			AvailableSemesters: []int{1, 2},
			LecturesWeek:       2,
			SeminarsWeek:       1,
			Workload:           3.0,
		})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/courses/byId/"+courseID.String(), nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	var course map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &course))
	// A single object, not a list, and shaped like one element of GET /courses/.
	assert.Equal(t, courseID.String(), course["id"])
	assert.Equal(t, "Линейная алгебра", course["title"])
	assert.Equal(t, float64(2), course["lectures_week"])
	assert.Equal(t, float64(1), course["seminars_week"])
	assert.Contains(t, course, "available_semesters")
	assert.Contains(t, course, "prerequisites")
	assert.Contains(t, course, "corequisites")
	// normalizeCourse on the frontend maps this to Course.type; CourseToResponse
	// alone does not emit it.
	assert.Equal(t, "elective", course["by_major_type"])
}

func TestGetCourseByIDInvalidUUID(t *testing.T) {
	router := setupRouterRoot(t, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/courses/byId/not-a-uuid", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 400, w.Code)
}

func TestGetCourseByIDNotFound(t *testing.T) {
	router := setupRouterRoot(t, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/courses/byId/"+uuid.New().String(), nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 404, w.Code)
}

// The `byId/` static segment shares a tree level with the `/:id` wildcard, where `:id`
// means a cohort year or major UUID. Guards against a future route change making
// /courses/byId/... fall through to getCourses (which answers with a list).
func TestGetCourseByIDDoesNotShadowCohortRoute(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		s.CreateCourse(interfaces.CourseData{
			ID:                 uuid.New(),
			Title:              "Python",
			Category:           enums.CourseCategoryTech,
			AvailableSemesters: []int{1},
			AllowedCohorts:     []int{2025},
			Workload:           2.0,
		})
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/courses/2025", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var courses []map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &courses))
	assert.Len(t, courses, 1)
}
