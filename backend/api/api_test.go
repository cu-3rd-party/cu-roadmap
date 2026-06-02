package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/cu-3rd-party/cu-roadmap/backend/store"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func setupRouter(t *testing.T, seed func(s store.StoreBase)) *gin.RouterGroup {
	t.Helper()

	store.CloseStore()
	_, err := store.InitStore(true, "")
	assert.NoError(t, err)

	s := store.GetStore()
	if seed != nil {
		seed(s)
	}

	router := gin.New()
	apiV1 := router.Group("/api/v1")
	RegisterGraphRoutes(apiV1.Group("/graph"))
	RegisterMajorsRoutes(apiV1.Group("/majors"))
	RegisterCoursesRoutes(apiV1.Group("/courses"))
	RegisterPlannerRoutes(apiV1.Group("/planner"))
	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	return router.Group("")
}

func setupRouterRoot(t *testing.T, seed func(s store.StoreBase)) *gin.Engine {
	t.Helper()

	store.CloseStore()
	_, err := store.InitStore(true, "")
	assert.NoError(t, err)

	s := store.GetStore()
	if seed != nil {
		seed(s)
	}

	router := gin.New()
	apiV1 := router.Group("/api/v1")
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

func TestGetCoursesEmpty(t *testing.T) {
	router := setupRouterRoot(t, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/courses/", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	assert.Equal(t, "null", strings.TrimSpace(w.Body.String()))
}

func TestGetCoursesWithData(t *testing.T) {
	router := setupRouterRoot(t, func(s store.StoreBase) {
		c := store.CourseData{
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

func TestGetMajorsEmpty(t *testing.T) {
	router := setupRouterRoot(t, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/majors/", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	assert.Equal(t, "null", strings.TrimSpace(w.Body.String()))
}

func TestGetMajorsWithData(t *testing.T) {
	router := setupRouterRoot(t, func(s store.StoreBase) {
		m := store.MajorData{ID: uuid.New(), Title: "SE", School: "Tech"}
		s.CreateMajor(m)
		c := store.CourseData{ID: uuid.New(), Title: "Python", AvailableSemesters: []int{1}, Workload: 4.0}
		s.CreateCourse(c)
		s.CreateMajorRequirement(store.MajorRequirementData{ID: uuid.New(), MajorID: m.ID, CourseID: c.ID, RequirementType: enums.RequirementTypeMajorCore})
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
	reqs, ok := majors[0]["requirements"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, reqs, 1)
}

func TestGetGraphDataEmpty(t *testing.T) {
	router := setupRouterRoot(t, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/graph/data", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Nil(t, resp["nodes"])
	assert.Nil(t, resp["edges"])
}

func TestGetGraphDataWithData(t *testing.T) {
	router := setupRouterRoot(t, func(s store.StoreBase) {
		c1 := store.CourseData{ID: uuid.New(), Title: "A", AvailableSemesters: []int{1}, Workload: 3.0}
		c2 := store.CourseData{ID: uuid.New(), Title: "B", AvailableSemesters: []int{1}, Workload: 3.0}
		s.CreateCourse(c1)
		s.CreateCourse(c2)
		s.CreateCourseDependency(store.CourseDependencyData{ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: c1.ID, DependencyType: enums.DependencyTypePrerequisite})
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
	router := setupRouterRoot(t, func(s store.StoreBase) {
		m1 := store.MajorData{ID: uuid.New(), Title: "SE", School: "Tech"}
		m2 := store.MajorData{ID: uuid.New(), Title: "AI", School: "Tech"}
		s.CreateMajor(m1)
		s.CreateMajor(m2)

		c1 := store.CourseData{ID: uuid.New(), Title: "A", AvailableSemesters: []int{1}, Workload: 3.0}
		c2 := store.CourseData{ID: uuid.New(), Title: "B", AvailableSemesters: []int{1}, Workload: 3.0}
		c3 := store.CourseData{ID: uuid.New(), Title: "C", AvailableSemesters: []int{1}, Workload: 3.0}
		s.CreateCourse(c1)
		s.CreateCourse(c2)
		s.CreateCourse(c3)

		s.CreateMajorRequirement(store.MajorRequirementData{ID: uuid.New(), MajorID: m1.ID, CourseID: c1.ID, RequirementType: enums.RequirementTypeMajorCore})
		s.CreateMajorRequirement(store.MajorRequirementData{ID: uuid.New(), MajorID: m1.ID, CourseID: c2.ID, RequirementType: enums.RequirementTypeMajorCore})
		s.CreateMajorRequirement(store.MajorRequirementData{ID: uuid.New(), MajorID: m2.ID, CourseID: c1.ID, RequirementType: enums.RequirementTypeMajorCore})
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
	router := setupRouterRoot(t, func(s store.StoreBase) {
		m := store.MajorData{ID: uuid.New(), Title: "SE", School: "Tech"}
		s.CreateMajor(m)
		c := store.CourseData{ID: uuid.New(), Title: "Python", AvailableSemesters: []int{1, 2}, Workload: 4.0}
		s.CreateCourse(c)
		s.CreateMajorRequirement(store.MajorRequirementData{ID: uuid.New(), MajorID: m.ID, CourseID: c.ID, RequirementType: enums.RequirementTypeMajorCore})
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
	router := setupRouterRoot(t, func(s store.StoreBase) {
		c1 := store.CourseData{ID: uuid.New(), Title: "A", AvailableSemesters: []int{1}, Workload: 4.0}
		c2 := store.CourseData{ID: uuid.New(), Title: "B", AvailableSemesters: []int{2}, Workload: 5.0}
		s.CreateCourse(c1)
		s.CreateCourse(c2)
		s.CreateCourseDependency(store.CourseDependencyData{ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: c1.ID, DependencyType: enums.DependencyTypePrerequisite})
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
	router := setupRouterRoot(t, func(s store.StoreBase) {
		c1 := store.CourseData{ID: uuid.New(), Title: "A", AvailableSemesters: []int{1}, Workload: 6.0}
		c2 := store.CourseData{ID: uuid.New(), Title: "B", AvailableSemesters: []int{1}, Workload: 7.0}
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
	router := setupRouterRoot(t, func(s store.StoreBase) {
		c1 := store.CourseData{ID: uuid.New(), Title: "Python", AvailableSemesters: []int{1, 2}, Workload: 4.0}
		c2 := store.CourseData{ID: uuid.New(), Title: "Advanced", AvailableSemesters: []int{3, 4}, Workload: 5.0}
		s.CreateCourse(c1)
		s.CreateCourse(c2)
		s.CreateCourseDependency(store.CourseDependencyData{ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: c1.ID, DependencyType: enums.DependencyTypePrerequisite})
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
	router.GET("/api/v1/courses/", GetCourses)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/courses/", nil)
	router.ServeHTTP(w, req)

	assert.Equal(t, 503, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "store not initialized")

	store.CloseStore()
	_, err := store.InitStore(true, "")
	assert.NoError(t, err)
}

func TestGetGraphDataWithRecommendedSemester(t *testing.T) {
	router := setupRouterRoot(t, func(s store.StoreBase) {
		c := store.CourseData{
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

func TestCreateCourseAdmin(t *testing.T) {
	router := setupRouterRoot(t, nil)

	body := `{"title":"New Course","course_type":"mandatory","category":"tech","workload":5.0}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/courses/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Admin-Token", "admin")
	router.ServeHTTP(w, req)

	assert.Equal(t, 201, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NotNil(t, resp["id"])
}

func TestUpdateCourseAdmin(t *testing.T) {
	router := setupRouterRoot(t, func(s store.StoreBase) {
		c := store.CourseData{ID: uuid.New(), Title: "Old", Category: enums.CourseCategoryTech}
		s.CreateCourse(c)
	})

	courses := getCoursesList(router, t)
	assert.Len(t, courses, 1)
	courseID := courses[0]["id"].(string)

	body := `{"title":"Updated Course","course_type":"mandatory","category":"tech","workload":6.0}`
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/courses/"+courseID, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Admin-Token", "admin")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	// Verify
	coursesAfter := getCoursesList(router, t)
	assert.Equal(t, "Updated Course", coursesAfter[0]["title"])
}

func TestDeleteCourseAdmin(t *testing.T) {
	router := setupRouterRoot(t, func(s store.StoreBase) {
		c := store.CourseData{ID: uuid.New(), Title: "To Delete"}
		s.CreateCourse(c)
	})

	courses := getCoursesList(router, t)
	assert.Len(t, courses, 1)
	courseID := courses[0]["id"].(string)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/v1/courses/"+courseID, nil)
	req.Header.Set("X-Admin-Token", "admin")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)

	coursesAfter := getCoursesList(router, t)
	assert.Len(t, coursesAfter, 0)
}

func TestUpdateMajorAdmin(t *testing.T) {
	router := setupRouterRoot(t, func(s store.StoreBase) {
		m := store.MajorData{ID: uuid.New(), Title: "Old Major", School: "Tech"}
		s.CreateMajor(m)
		c := store.CourseData{ID: uuid.New(), Title: "Course"}
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
	req.Header.Set("X-Admin-Token", "admin")
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
