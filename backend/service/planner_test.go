package service

import (
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/cu-3rd-party/cu-roadmap/backend/store"
)

func newTestData() (interfaces.StoreBase, *interfaces.CourseData, *interfaces.CourseData, *interfaces.CourseData) {
	s := store.NewMemoryStore()
	s.Init()

	c1 := interfaces.CourseData{ID: uuid.New(), Title: "Python Basics", Description: new("Intro"), AvailableSemesters: []int{1, 2}, RecommendedSemester: new(1), Workload: 4.0}
	c2 := interfaces.CourseData{ID: uuid.New(), Title: "Advanced Python", Description: new("Advanced"), AvailableSemesters: []int{3, 4}, RecommendedSemester: new(3), Workload: 5.0}
	c3 := interfaces.CourseData{ID: uuid.New(), Title: "Algorithms", Description: new("Algos"), AvailableSemesters: []int{1, 3}, RecommendedSemester: new(2), Workload: 6.0}

	s.CreateCourse(c1)
	s.CreateCourse(c2)
	s.CreateCourse(c3)

	dep := interfaces.CourseDependencyData{ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: c1.ID, DependencyType: enums.DependencyTypePrerequisite}
	s.CreateCourseDependency(dep)

	return s, &c1, &c2, &c3
}

func TestGenerateRoadmapBasic(t *testing.T) {
	s, c1, c2, c3 := newTestData()
	defer s.Close()

	major := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech"}
	s.CreateMajor(major)
	s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: major.ID, CourseID: c1.ID, RequirementType: enums.RequirementTypeMajorCore})
	s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: major.ID, CourseID: c2.ID, RequirementType: enums.RequirementTypeMajorCore})
	_ = c3

	planner := NewGreedyPlanner(s)
	roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, major.ID, 1, 12.0, 0)
	assert.NoError(t, err)
	assert.IsType(t, []map[string]interface{}{}, roadmap)
	assert.NotZero(t, len(roadmap.([]map[string]interface{})))
}

func TestGenerateRoadmapWithPassedCourses(t *testing.T) {
	s, c1, c2, c3 := newTestData()
	defer s.Close()

	major := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech"}
	s.CreateMajor(major)
	s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: major.ID, CourseID: c1.ID, RequirementType: enums.RequirementTypeMajorCore})
	s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: major.ID, CourseID: c2.ID, RequirementType: enums.RequirementTypeMajorCore})
	_ = c3

	planner := NewGreedyPlanner(s)
	roadmap, err := planner.GenerateRoadmap([]uuid.UUID{c1.ID}, major.ID, 3, 12.0, 0)
	assert.NoError(t, err)
	assert.IsType(t, []map[string]interface{}{}, roadmap)
}

func TestGenerateRoadmapMajorNotFound(t *testing.T) {
	s := store.NewMemoryStore()
	s.Init()
	defer s.Close()

	planner := NewGreedyPlanner(s)
	roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, uuid.New(), 1, 12.0, 0)
	assert.NoError(t, err)
	assert.IsType(t, map[string]interface{}{}, roadmap)
	assert.Contains(t, roadmap.(map[string]interface{}), "error")
}

func TestGenerateRoadmapRespectsMaxLoad(t *testing.T) {
	s, c1, c2, c3 := newTestData()
	defer s.Close()

	major := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech"}
	s.CreateMajor(major)
	s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: major.ID, CourseID: c1.ID, RequirementType: enums.RequirementTypeMajorCore})
	s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: major.ID, CourseID: c2.ID, RequirementType: enums.RequirementTypeMajorCore})
	_ = c3

	planner := NewGreedyPlanner(s)
	roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, major.ID, 1, 4.0, 0)
	assert.NoError(t, err)
	rm := roadmap.([]map[string]interface{})
	for _, sem := range rm {
		if load, ok := sem["total_load"]; ok {
			assert.LessOrEqual(t, load.(float64), 4.0)
		}
	}
}

func TestGenerateRoadmapEmptyMajor(t *testing.T) {
	s, _, _, _ := newTestData()
	defer s.Close()

	planner := NewGreedyPlanner(s)
	roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, uuid.New(), 1, 12.0, 0)
	assert.NoError(t, err)
	assert.IsType(t, map[string]interface{}{}, roadmap)
	assert.Contains(t, roadmap.(map[string]interface{}), "error")
}

func TestGenerateRoadmapAllPassed(t *testing.T) {
	s, c1, c2, _ := newTestData()
	defer s.Close()

	major := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech"}
	s.CreateMajor(major)
	s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: major.ID, CourseID: c1.ID, RequirementType: enums.RequirementTypeMajorCore})
	s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: major.ID, CourseID: c2.ID, RequirementType: enums.RequirementTypeMajorCore})

	planner := NewGreedyPlanner(s)
	roadmap, err := planner.GenerateRoadmap([]uuid.UUID{c1.ID, c2.ID}, major.ID, 1, 12.0, 0)
	assert.NoError(t, err)
	assert.IsType(t, []map[string]interface{}{}, roadmap)
}
