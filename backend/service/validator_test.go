package service

import (
	"strings"
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
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
		Category:           enums.CourseCategorySTEM,
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
		3,
		12.0,
	)
	assert.False(t, result.IsValid)
	hasPrereqError := false
	for _, m := range result.Messages {
		if strings.Contains(m.Message, "пререквизит") {
			hasPrereqError = true
		}
	}
	assert.True(t, hasPrereqError)
}

func TestValidateSemesterPassedPrerequisite(t *testing.T) {
	s, c1, c2, _ := newTestData()
	defer s.Close()

	allCourses, _ := s.GetAllCourses()
	validator := NewRoadmapValidator(allCourses)
	validator.LoadDependencies(s)

	passed := map[uuid.UUID]bool{c1.ID: true}

	cSoft := interfaces.CourseData{ID: uuid.New(), Title: "Soft", Category: enums.CourseCategorySoft, Workload: 2.0}

	result := validator.ValidateSemester(
		[]interfaces.CourseData{*c2, cSoft},
		passed,
		3,
		12.0,
	)
	assert.True(t, result.IsValid)
}

func TestValidateSemesterRequiresExclusiveFundamentalsCourse(t *testing.T) {
	s := store.NewMemoryStore()
	s.Init("admin")
	defer s.Close()

	forced := interfaces.CourseData{
		ID:                 uuid.New(),
		Title:              "Физическая культура",
		AvailableSemesters: []int{2},
		Workload:           2.0,
		Category:           enums.CourseCategoryFundamentals,
		CourseType:         enums.CourseTypeMandatory,
		AnalogGroup:        "ОБЯЗ: Fundamentals",
	}
	other := interfaces.CourseData{
		ID:                 uuid.New(),
		Title:              "Math",
		AvailableSemesters: []int{2},
		Workload:           4.0,
		Category:           enums.CourseCategorySTEM,
	}

	s.CreateCourse(forced)
	s.CreateCourse(other)

	allCourses, _ := s.GetAllCourses()
	validator := NewRoadmapValidator(allCourses)
	validator.LoadDependencies(s)

	result := validator.ValidateSemester(
		[]interfaces.CourseData{other},
		make(map[uuid.UUID]bool),
		2,
		12.0,
	)
	assert.False(t, result.IsValid)
	found := false
	for _, m := range result.Messages {
		if strings.Contains(m.Message, "Физическая культура") {
			found = true
			break
		}
	}
	assert.True(t, found, "validator should require the exclusive fundamentals course in its semester")
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

	results := validator.ValidateFullRoadmap(roadmap, make(map[uuid.UUID]bool), 12.0, nil)
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

	results := validator.ValidateFullRoadmap(roadmap, make(map[uuid.UUID]bool), 12.0, nil)
	assert.False(t, results[0]["valid"].(bool))
}

func TestValidateFullRoadmapPrereqInSameSemester(t *testing.T) {
	s, c1, c2, _ := newTestData()
	defer s.Close()

	allCourses, _ := s.GetAllCourses()
	validator := NewRoadmapValidator(allCourses)
	validator.LoadDependencies(s)

	roadmap := []map[string]interface{}{
		{"semester": 1, "course_ids": []string{c2.ID.String(), c1.ID.String()}},
	}

	results := validator.ValidateFullRoadmap(roadmap, make(map[uuid.UUID]bool), 12.0, nil)
	assert.Len(t, results, 1)
	assert.False(t, results[0]["valid"].(bool))
}

func TestValidateFullRoadmapPrereqAfterCourse(t *testing.T) {
	s, c1, c2, _ := newTestData()
	defer s.Close()

	allCourses, _ := s.GetAllCourses()
	validator := NewRoadmapValidator(allCourses)
	validator.LoadDependencies(s)

	roadmap := []map[string]interface{}{
		{"semester": 1, "course_ids": []string{c2.ID.String()}},
		{"semester": 2, "course_ids": []string{c1.ID.String()}},
	}

	results := validator.ValidateFullRoadmap(roadmap, make(map[uuid.UUID]bool), 12.0, nil)
	assert.Len(t, results, 2)
	assert.False(t, results[0]["valid"].(bool))
}

func TestValidateFullRoadmapCoreqsInDifferentSemesters(t *testing.T) {
	s := store.NewMemoryStore()
	s.Init("admin")
	defer s.Close()

	c1 := interfaces.CourseData{ID: uuid.New(), Title: "Python Basics", Workload: 4.0, AvailableSemesters: []int{1, 2}}
	c4 := interfaces.CourseData{ID: uuid.New(), Title: "Coreq Course", Workload: 3.0, AvailableSemesters: []int{1, 2}}

	s.CreateCourse(c1)
	s.CreateCourse(c4)

	s.CreateCourseDependency(interfaces.CourseDependencyData{
		ID:               uuid.New(),
		CourseID:         c4.ID,
		RequiredCourseID: c1.ID,
		DependencyType:   enums.DependencyTypeCorequisite,
	})

	allCourses, _ := s.GetAllCourses()
	validator := NewRoadmapValidator(allCourses)
	validator.LoadDependencies(s)

	roadmap := []map[string]interface{}{
		{"semester": 1, "course_ids": []string{c4.ID.String()}},
		{"semester": 2, "course_ids": []string{c1.ID.String()}},
	}

	results := validator.ValidateFullRoadmap(roadmap, make(map[uuid.UUID]bool), 12.0, nil)
	assert.Len(t, results, 2)
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
	path, err := plannerSvc.FindPathToCourse(c2.ID, make(map[uuid.UUID]bool), 1, 12.0, nil)
	assert.NoError(t, err)
	assert.NotZero(t, len(path))
}
