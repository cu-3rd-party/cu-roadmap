package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestValidateRoadmapPrereqInSameSemester(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		c1 := interfaces.CourseData{ID: uuid.New(), Title: "Python Basics", AvailableSemesters: []int{1, 2}, Workload: 4.0}
		c2 := interfaces.CourseData{ID: uuid.New(), Title: "Advanced Python", AvailableSemesters: []int{1, 2}, Workload: 5.0}
		s.CreateCourse(c1)
		s.CreateCourse(c2)
		s.CreateCourseDependency(interfaces.CourseDependencyData{
			ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: &c1.ID,
			DependencyType: enums.DependencyTypePrerequisite,
		})
	})

	courses := getCoursesList(router, t)
	c1 := findCourseByTitle(courses, "Python Basics")
	c2 := findCourseByTitle(courses, "Advanced Python")

	body := `{
		"roadmap": [{"semester": 1, "course_ids": ["` + c2["id"].(string) + `","` + c1["id"].(string) + `"]}],
		"max_load": 12.0,
		"current_semester": 1
	}`

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/planner/validate-roadmap/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	results := resp["validation_results"].([]interface{})
	assert.Len(t, results, 1)
	assert.False(t, results[0].(map[string]interface{})["valid"].(bool))
}

func TestValidateRoadmapPrereqAfterCourse(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		c1 := interfaces.CourseData{ID: uuid.New(), Title: "Python Basics", AvailableSemesters: []int{2}, Workload: 4.0}
		c2 := interfaces.CourseData{ID: uuid.New(), Title: "Advanced Python", AvailableSemesters: []int{1}, Workload: 5.0}
		s.CreateCourse(c1)
		s.CreateCourse(c2)
		s.CreateCourseDependency(interfaces.CourseDependencyData{
			ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: &c1.ID,
			DependencyType: enums.DependencyTypePrerequisite,
		})
	})

	courses := getCoursesList(router, t)
	c1 := findCourseByTitle(courses, "Python Basics")
	c2 := findCourseByTitle(courses, "Advanced Python")

	body := `{
		"roadmap": [
			{"semester": 1, "course_ids": ["` + c2["id"].(string) + `"]},
			{"semester": 2, "course_ids": ["` + c1["id"].(string) + `"]}
		],
		"max_load": 12.0,
		"current_semester": 1
	}`

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/planner/validate-roadmap/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	results := resp["validation_results"].([]interface{})
	assert.Len(t, results, 2)
	assert.False(t, results[0].(map[string]interface{})["valid"].(bool))
}

func TestValidateRoadmapCoreqsInDifferentSemesters(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		c1 := interfaces.CourseData{ID: uuid.New(), Title: "Python Basics", AvailableSemesters: []int{1, 2}, Workload: 4.0}
		c4 := interfaces.CourseData{ID: uuid.New(), Title: "Coreq Course", AvailableSemesters: []int{1, 2}, Workload: 3.0}
		s.CreateCourse(c1)
		s.CreateCourse(c4)
		s.CreateCourseDependency(interfaces.CourseDependencyData{
			ID: uuid.New(), CourseID: c4.ID, RequiredCourseID: &c1.ID,
			DependencyType: enums.DependencyTypeCorequisite,
		})
	})

	courses := getCoursesList(router, t)
	c1 := findCourseByTitle(courses, "Python Basics")
	c4 := findCourseByTitle(courses, "Coreq Course")

	body := `{
		"roadmap": [
			{"semester": 1, "course_ids": ["` + c4["id"].(string) + `"]},
			{"semester": 2, "course_ids": ["` + c1["id"].(string) + `"]}
		],
		"max_load": 12.0,
		"current_semester": 1
	}`

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/planner/validate-roadmap/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	results := resp["validation_results"].([]interface{})
	assert.Len(t, results, 2)
	assert.False(t, results[0].(map[string]interface{})["valid"].(bool))
}

func TestValidateRoadmapWithCurrentSemester(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		c1 := interfaces.CourseData{ID: uuid.New(), Title: "Python Basics", AvailableSemesters: []int{1, 2}, Workload: 4.0, Category: enums.CourseCategorySTEM}
		c2 := interfaces.CourseData{ID: uuid.New(), Title: "Advanced Python", AvailableSemesters: []int{3, 4}, Workload: 5.0, Category: enums.CourseCategorySTEM}
		c3 := interfaces.CourseData{ID: uuid.New(), Title: "Soft Skills", AvailableSemesters: []int{3, 4}, Workload: 2.0, Category: enums.CourseCategorySoft}
		s.CreateCourse(c1)
		s.CreateCourse(c2)
		s.CreateCourse(c3)
		s.CreateCourseDependency(interfaces.CourseDependencyData{
			ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: &c1.ID,
			DependencyType: enums.DependencyTypePrerequisite,
		})
	})

	courses := getCoursesList(router, t)
	c1 := findCourseByTitle(courses, "Python Basics")
	c2 := findCourseByTitle(courses, "Advanced Python")
	c3 := findCourseByTitle(courses, "Soft Skills")

	// current_semester=3 means semester 1 is in the past → c1 treated as passed
	body := `{
		"roadmap": [
			{"semester": 1, "course_ids": ["` + c1["id"].(string) + `"]},
			{"semester": 3, "course_ids": ["` + c2["id"].(string) + `", "` + c3["id"].(string) + `"]}
		],
		"max_load": 12.0,
		"current_semester": 3
	}`

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/planner/validate-roadmap/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	results := resp["validation_results"].([]interface{})
	assert.Len(t, results, 2)
	assert.True(t, results[0].(map[string]interface{})["valid"].(bool))
	assert.True(t, results[1].(map[string]interface{})["valid"].(bool))
}
