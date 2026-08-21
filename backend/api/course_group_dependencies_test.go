package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestAddAndGetCourseDependencyGroup(t *testing.T) {
	courseID := uuid.New()
	groupID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		_, _ = s.CreateCourse(interfaces.CourseData{
			ID:                 courseID,
			Title:              "Advanced Go",
			AvailableSemesters: []int{2},
			Workload:           3.0,
		})
		rootOp := enums.LogicalOpAnd
		box, _ := s.CreateBox(interfaces.BoxData{
			ID:        uuid.New(),
			Kind:      enums.BoxKindLogical,
			Title:     "Go Prerequisites Box",
			LogicalOp: &rootOp,
		})
		_, _ = s.CreateDisciplineGroup(interfaces.DisciplineGroupData{
			ID:             groupID,
			Title:          "Go Prerequisites Group",
			MathExpression: json.RawMessage("{}"),
			RootBoxID:      box.ID,
		})
	})

	// 1. Add course dependency pointing to groupID
	body, _ := json.Marshal(map[string]interface{}{
		"required_group_id": groupID.String(),
		"dependency_type":   "prerequisite",
	})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/courses/"+courseID.String()+"/dependencies", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	addAuthCookie(t, req)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var createdDep map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &createdDep)
	assert.NoError(t, err)
	assert.Equal(t, courseID.String(), createdDep["course_id"])
	assert.Equal(t, groupID.String(), createdDep["required_group_id"])
	assert.Nil(t, createdDep["required_course_id"])

	// 2. Get dependencies by course ID
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("GET", "/api/v1/courses/"+courseID.String()+"/dependencies", nil)
	router.ServeHTTP(w2, req2)

	assert.Equal(t, http.StatusOK, w2.Code)
	var deps []map[string]interface{}
	err = json.Unmarshal(w2.Body.Bytes(), &deps)
	assert.NoError(t, err)
	assert.Len(t, deps, 1)
	assert.Equal(t, groupID.String(), deps[0]["required_group_id"])

	// 3. Delete dependency by ID
	depID := deps[0]["id"].(string)
	w3 := httptest.NewRecorder()
	req3, _ := http.NewRequest("DELETE", "/api/v1/courses/dependencies/"+depID, nil)
	addAuthCookie(t, req3)
	router.ServeHTTP(w3, req3)

	assert.Equal(t, http.StatusOK, w3.Code)

	// Verify empty
	w4 := httptest.NewRecorder()
	req4, _ := http.NewRequest("GET", "/api/v1/courses/"+courseID.String()+"/dependencies", nil)
	router.ServeHTTP(w4, req4)

	assert.Equal(t, http.StatusOK, w4.Code)
	var depsAfter []map[string]interface{}
	json.Unmarshal(w4.Body.Bytes(), &depsAfter)
	assert.Len(t, depsAfter, 0)
}

func TestAttachDisciplineGroupToCourse(t *testing.T) {
	courseID := uuid.New()
	groupID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		_, _ = s.CreateCourse(interfaces.CourseData{
			ID:                 courseID,
			Title:              "Machine Learning",
			AvailableSemesters: []int{3},
			Workload:           4.0,
		})
		rootOp := enums.LogicalOpAnd
		box, _ := s.CreateBox(interfaces.BoxData{
			ID:        uuid.New(),
			Kind:      enums.BoxKindLogical,
			Title:     "ML Math Prerequisites Box",
			LogicalOp: &rootOp,
		})
		_, _ = s.CreateDisciplineGroup(interfaces.DisciplineGroupData{
			ID:             groupID,
			Title:          "ML Math Prerequisites",
			MathExpression: json.RawMessage("{}"),
			RootBoxID:      box.ID,
		})
	})

	// 1. Attach group to course via discipline-groups route
	body, _ := json.Marshal(map[string]interface{}{
		"course_id":       courseID.String(),
		"dependency_type": "prerequisite",
	})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/discipline-groups/"+groupID.String()+"/attach", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	addAuthCookie(t, req)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify course has dependency attached
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("GET", "/api/v1/courses/"+courseID.String()+"/dependencies", nil)
	router.ServeHTTP(w2, req2)

	assert.Equal(t, http.StatusOK, w2.Code)
	var deps []map[string]interface{}
	json.Unmarshal(w2.Body.Bytes(), &deps)
	assert.Len(t, deps, 1)
	assert.Equal(t, groupID.String(), deps[0]["required_group_id"])

	// 2. Detach group from course via discipline-groups route
	detachBody, _ := json.Marshal(map[string]interface{}{
		"course_id": courseID.String(),
	})
	w3 := httptest.NewRecorder()
	req3, _ := http.NewRequest("POST", "/api/v1/discipline-groups/"+groupID.String()+"/detach", bytes.NewBuffer(detachBody))
	req3.Header.Set("Content-Type", "application/json")
	addAuthCookie(t, req3)
	router.ServeHTTP(w3, req3)

	assert.Equal(t, http.StatusOK, w3.Code)

	// Verify dependency detached
	w4 := httptest.NewRecorder()
	req4, _ := http.NewRequest("GET", "/api/v1/courses/"+courseID.String()+"/dependencies", nil)
	router.ServeHTTP(w4, req4)

	var depsAfter []map[string]interface{}
	json.Unmarshal(w4.Body.Bytes(), &depsAfter)
	assert.Len(t, depsAfter, 0)
}

func TestCreateCourseWithGroupIDs(t *testing.T) {
	groupID := uuid.New()

	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		rootOp := enums.LogicalOpAnd
		box, _ := s.CreateBox(interfaces.BoxData{
			ID:        uuid.New(),
			Kind:      enums.BoxKindLogical,
			Title:     "Python Prereq Box",
			LogicalOp: &rootOp,
		})
		_, _ = s.CreateDisciplineGroup(interfaces.DisciplineGroupData{
			ID:             groupID,
			Title:          "Python Prereq Group",
			MathExpression: json.RawMessage("{}"),
			RootBoxID:      box.ID,
		})
	})

	body, _ := json.Marshal(map[string]interface{}{
		"title":                  "Deep Learning",
		"course_type":            "mandatory",
		"category":               "ai",
		"available_semesters":    []int{4},
		"workload":               5.0,
		"prerequisite_group_ids": []string{groupID.String()},
	})

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/courses/", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	addAuthCookie(t, req)
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	courseID := resp["id"]

	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("GET", "/api/v1/courses/"+courseID+"/dependencies", nil)
	router.ServeHTTP(w2, req2)

	assert.Equal(t, http.StatusOK, w2.Code)
	var deps []map[string]interface{}
	json.Unmarshal(w2.Body.Bytes(), &deps)
	assert.Len(t, deps, 1)
	assert.Equal(t, groupID.String(), deps[0]["required_group_id"])
}
