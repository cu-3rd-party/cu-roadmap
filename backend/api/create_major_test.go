package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestCreateMajorAdmin(t *testing.T) {
	router := setupRouterRoot(t, func(s interfaces.StoreBase) {
		// Create a course that will be used as a requirement
		c := interfaces.CourseData{
			ID:                 uuid.MustParse("00000000-0000-0000-0000-000000000001"),
			Title:              "Prereq Course",
			AvailableSemesters: []int{1},
			Workload:           3.0,
		}
		s.CreateCourse(c)
	})

	payload := `{
		"title": "New Test Major",
		"school": "School of Testing",
		"requirements": [
			{
				"course_id": "00000000-0000-0000-0000-000000000001",
				"type": "major_core"
			}
		]
	}`

	// Add an admin cookie to the request
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/majors/", strings.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")

	addAuthCookie(t, req)

	router.ServeHTTP(w, req)

	assert.Equal(t, 200, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)

	idStr, ok := resp["id"].(string)
	assert.True(t, ok)
	assert.NotEmpty(t, idStr)

	// Verify the major was actually created
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("GET", "/api/v1/majors/", nil)
	router.ServeHTTP(w2, req2)

	assert.Equal(t, 200, w2.Code)
	var majors []map[string]interface{}
	json.Unmarshal(w2.Body.Bytes(), &majors)

	assert.Len(t, majors, 1)
	assert.Equal(t, "New Test Major", majors[0]["title"])
	assert.Equal(t, "School of Testing", majors[0]["school"])

	reqs, ok := majors[0]["requirements"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, reqs, 1)
	reqMap := reqs[0].(map[string]interface{})
	assert.Equal(t, "00000000-0000-0000-0000-000000000001", reqMap["course_id"])
	assert.Equal(t, "major_core", reqMap["type"])
}
