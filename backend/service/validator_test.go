package service

import (
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func createCourse(id *uuid.UUID, title string, workload float64, sems []int) interfaces.CourseData {
	if id == nil {
		id = new(uuid.New())
	}
	if sems == nil {
		sems = []int{1, 2}
	}
	return interfaces.CourseData{
		ID:                 *id,
		Title:              title,
		AvailableSemesters: sems,
		Workload:           workload,
	}
}

func TestValidateSemesterValid(t *testing.T) {
	s, c1, _, _ := newTestData()
	defer s.Close()

	allCourses, _ := s.GetAllCourses()
	validator := NewRoadmapValidator(allCourses)
	validator.LoadDependencies(s)

	result := validator.ValidateSemester(
		[]interfaces.CourseData{*c1},
		make(map[uuid.UUID]bool),
		1,
		12.0,
	)
	assert.True(t, result.IsValid)
}

func TestValidateSemesterWorkloadExceeded(t *testing.T) {
	s, c1, c2, _ := newTestData()
	defer s.Close()

	allCourses, _ := s.GetAllCourses()
	validator := NewRoadmapValidator(allCourses)
	validator.LoadDependencies(s)

	result := validator.ValidateSemester(
		[]interfaces.CourseData{*c1, *c2},
		make(map[uuid.UUID]bool),
		1,
		4.0,
	)
	assert.False(t, result.IsValid)
	assert.NotZero(t, len(result.Messages))
}

func TestValidateSemesterWrongSemesterOffering(t *testing.T) {
	s, _, c2, _ := newTestData()
	defer s.Close()

	allCourses, _ := s.GetAllCourses()
	validator := NewRoadmapValidator(allCourses)
	validator.LoadDependencies(s)

	result := validator.ValidateSemester(
		[]interfaces.CourseData{*c2},
		make(map[uuid.UUID]bool),
		1,
		12.0,
	)
	assert.False(t, result.IsValid)
	hasError := false
	for _, m := range result.Messages {
		if m.Level == "error" {
			hasError = true
			break
		}
	}
	assert.True(t, hasError)
}

func TestValidateSemesterMissingPrerequisite(t *testing.T) {
	s, _, c2, _ := newTestData()
	defer s.Close()

	allCourses, _ := s.GetAllCourses()
	validator := NewRoadmapValidator(allCourses)
	validator.LoadDependencies(s)

	result := validator.ValidateSemester(
		[]interfaces.CourseData{*c2},
		make(map[uuid.UUID]bool),
		1,
		12.0,
	)
	assert.False(t, result.IsValid)
	assert.Contains(t, result.Messages[0].Message, "пререквизит")
}

func TestValidateSemesterPassedPrerequisite(t *testing.T) {
	s, c1, c2, _ := newTestData()
	defer s.Close()

	allCourses, _ := s.GetAllCourses()
	validator := NewRoadmapValidator(allCourses)
	validator.LoadDependencies(s)

	passed := map[uuid.UUID]bool{c1.ID: true}
	result := validator.ValidateSemester(
		[]interfaces.CourseData{*c2},
		passed,
		1,
		12.0,
	)
	assert.True(t, result.IsValid)
}

func TestValidateFullRoadmapValid(t *testing.T) {
	s, c1, c2, _ := newTestData()
	defer s.Close()

	allCourses, _ := s.GetAllCourses()
	validator := NewRoadmapValidator(allCourses)
	validator.LoadDependencies(s)

	roadmap := []map[string]interface{}{
		{"semester": 1, "course_ids": []string{c1.ID.String()}},
		{"semester": 3, "course_ids": []string{c2.ID.String()}},
	}

	results := validator.ValidateFullRoadmap(roadmap, make(map[uuid.UUID]bool), 12.0)
	assert.Len(t, results, 2)
}

func TestValidateFullRoadmapMissingPrereq(t *testing.T) {
	s, _, c2, _ := newTestData()
	defer s.Close()

	allCourses, _ := s.GetAllCourses()
	validator := NewRoadmapValidator(allCourses)
	validator.LoadDependencies(s)

	roadmap := []map[string]interface{}{
		{"semester": 1, "course_ids": []string{c2.ID.String()}},
	}

	results := validator.ValidateFullRoadmap(roadmap, make(map[uuid.UUID]bool), 12.0)
	assert.False(t, results[0]["valid"].(bool))
}

func TestCreateValidatorFromStore(t *testing.T) {
	s, _, _, _ := newTestData()
	defer s.Close()

	validator, err := CreateValidatorFromStore(s)
	assert.NoError(t, err)
	assert.NotNil(t, validator)
	assert.NotZero(t, len(validator.AllCourses))
}

func TestFindPathToCourse(t *testing.T) {
	s, _, c2, _ := newTestData()
	defer s.Close()

	plannerSvc := NewPlannerService(s)
	path, err := plannerSvc.FindPathToCourse(c2.ID, make(map[uuid.UUID]bool), 1, 12.0)
	assert.NoError(t, err)
	assert.NotZero(t, len(path))
}
