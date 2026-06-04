package service

import (
	"fmt"
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/schemas"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/cu-3rd-party/cu-roadmap/backend/store"
)

type plannerFactory struct {
	name string
	kind PlannerKind
}

var roadmapPlannerFactories = []plannerFactory{
	{name: "greedy", kind: PlannerKindGreedy},
	{name: "dp", kind: PlannerKindDynamicProgramming},
	{name: "ilp", kind: PlannerKindIntegerLinearProgram},
	{name: "lp_relaxation", kind: PlannerKindLinearRelaxation},
}

func TestNewRoadmapPlanner(t *testing.T) {
	s := store.NewMemoryStore()
	s.Init("admin")
	defer s.Close()

	tests := []PlannerKind{
		PlannerKindGreedy,
		PlannerKindDynamicProgramming,
		PlannerKindIntegerLinearProgram,
		PlannerKindLinearRelaxation,
	}

	for _, kind := range tests {
		planner, err := NewRoadmapPlanner(kind, s)
		assert.NoError(t, err)
		assert.NotNil(t, planner)
	}

	_, err := NewRoadmapPlanner(PlannerKind("unknown"), s)
	assert.Error(t, err)
}

func newTestData() (interfaces.StoreBase, *interfaces.CourseData, *interfaces.CourseData, *interfaces.CourseData) {
	s := store.NewMemoryStore()
	s.Init("admin")

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

func createPlannerForTest(t testing.TB, kind PlannerKind, s interfaces.StoreBase) RoadmapPlanner {
	t.Helper()
	planner, err := NewRoadmapPlanner(kind, s)
	assert.NoError(t, err)
	assert.NotNil(t, planner)
	return planner
}

func runRoadmapPlannerTests(t *testing.T, testFn func(t *testing.T, factory plannerFactory)) {
	t.Helper()
	for _, factory := range roadmapPlannerFactories {
		factory := factory
		t.Run(factory.name, func(t *testing.T) {
			testFn(t, factory)
		})
	}
}

func runRoadmapPlannerTestsWithStore(
	t *testing.T,
	s interfaces.StoreBase,
	testFn func(t *testing.T, factory plannerFactory, planner RoadmapPlanner),
) {
	t.Helper()
	for _, factory := range roadmapPlannerFactories {
		factory := factory
		t.Run(factory.name, func(t *testing.T) {
			testFn(t, factory, createPlannerForTest(t, factory.kind, s))
		})
	}
}

func createMajorWithRequirements(s interfaces.StoreBase, courseIDs ...uuid.UUID) uuid.UUID {
	major := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech"}
	s.CreateMajor(major)
	for _, courseID := range courseIDs {
		s.CreateMajorRequirement(interfaces.MajorRequirementData{
			ID:              uuid.New(),
			MajorID:         major.ID,
			CourseID:        courseID,
			RequirementType: enums.RequirementTypeMajorCore,
		})
	}
	return major.ID
}

func TestGenerateRoadmapBasic(t *testing.T) {
	runRoadmapPlannerTests(t, func(t *testing.T, factory plannerFactory) {
		s, c1, c2, c3 := newTestData()
		defer s.Close()

		majorID := createMajorWithRequirements(s, c1.ID, c2.ID)
		_ = c3

		planner := createPlannerForTest(t, factory.kind, s)
		roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, nil, majorID, 1, 12.0, 0)
		assert.NoError(t, err)
		assert.IsType(t, []map[string]interface{}{}, roadmap)
		assert.NotZero(t, len(roadmap.([]map[string]interface{})))
	})
}

func TestGenerateRoadmapWithPassedCourses(t *testing.T) {
	runRoadmapPlannerTests(t, func(t *testing.T, factory plannerFactory) {
		s, c1, c2, c3 := newTestData()
		defer s.Close()

		majorID := createMajorWithRequirements(s, c1.ID, c2.ID)
		_ = c3

		planner := createPlannerForTest(t, factory.kind, s)
		roadmap, err := planner.GenerateRoadmap([]uuid.UUID{c1.ID}, nil, majorID, 3, 12.0, 0)
		assert.NoError(t, err)
		assert.IsType(t, []map[string]interface{}{}, roadmap)
	})
}

func TestGenerateRoadmapMajorNotFound(t *testing.T) {
	runRoadmapPlannerTests(t, func(t *testing.T, factory plannerFactory) {
		s := store.NewMemoryStore()
		s.Init("admin")
		defer s.Close()

		planner := createPlannerForTest(t, factory.kind, s)
		roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, nil, uuid.New(), 1, 12.0, 0)
		assert.NoError(t, err)
		assert.IsType(t, map[string]interface{}{}, roadmap)
		assert.Contains(t, roadmap.(map[string]interface{}), "error")
	})
}

func TestGenerateRoadmapRespectsMaxLoad(t *testing.T) {
	runRoadmapPlannerTests(t, func(t *testing.T, factory plannerFactory) {
		s, c1, c2, c3 := newTestData()
		defer s.Close()

		majorID := createMajorWithRequirements(s, c1.ID, c2.ID)
		_ = c3

		planner := createPlannerForTest(t, factory.kind, s)
		roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, nil, majorID, 1, 5.0, 0)
		assert.NoError(t, err)
		rm := roadmap.([]map[string]interface{})
		for _, sem := range rm {
			if load, ok := sem["total_load"]; ok {
				assert.LessOrEqual(t, load.(float64), 5.0)
			}
		}
	})
}

func TestGenerateRoadmapEmptyMajor(t *testing.T) {
	runRoadmapPlannerTests(t, func(t *testing.T, factory plannerFactory) {
		s, _, _, _ := newTestData()
		defer s.Close()

		planner := createPlannerForTest(t, factory.kind, s)
		roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, nil, uuid.New(), 1, 12.0, 0)
		assert.NoError(t, err)
		assert.IsType(t, map[string]interface{}{}, roadmap)
		assert.Contains(t, roadmap.(map[string]interface{}), "error")
	})
}

func TestGenerateRoadmapAllPassed(t *testing.T) {
	runRoadmapPlannerTests(t, func(t *testing.T, factory plannerFactory) {
		s, c1, c2, _ := newTestData()
		defer s.Close()

		majorID := createMajorWithRequirements(s, c1.ID, c2.ID)
		planner := createPlannerForTest(t, factory.kind, s)
		roadmap, err := planner.GenerateRoadmap([]uuid.UUID{c1.ID, c2.ID}, nil, majorID, 1, 12.0, 0)
		assert.NoError(t, err)
		assert.IsType(t, []map[string]interface{}{}, roadmap)
	})
}

func TestGenerateRoadmapOptimizationStrategiesDiverge(t *testing.T) {
	s, majorID := newOptimizationTradeoffData()
	defer s.Close()

	results := make(map[PlannerKind][]string)
	runRoadmapPlannerTestsWithStore(t, s, func(t *testing.T, factory plannerFactory, planner RoadmapPlanner) {
		roadmap, err := planner.GenerateRoadmap(nil, nil, majorID, 1, 6.0, 0)
		assert.NoError(t, err)

		rm := roadmap.([]map[string]interface{})
		assert.NotEmpty(t, rm)

		firstSemester, ok := rm[0]["course_ids"].([]string)
		assert.True(t, ok)
		results[factory.kind] = append([]string{}, firstSemester...)
	})

	assert.Len(t, results[PlannerKindGreedy], 1)
	assert.Len(t, results[PlannerKindDynamicProgramming], 2)
	assert.Len(t, results[PlannerKindIntegerLinearProgram], 2)
}

func TestGenerateRoadmapBaselineCompletesAllRequiredCourses(t *testing.T) {
	s, majorID := newSequentialPlannerData(8)
	defer s.Close()

	runRoadmapPlannerTestsWithStore(t, s, func(t *testing.T, factory plannerFactory, planner RoadmapPlanner) {
		roadmap, err := planner.GenerateRoadmap(nil, nil, majorID, 1, 6.0, 0)
		assert.NoError(t, err)

		rm := roadmap.([]map[string]interface{})
		assert.NotEmpty(t, rm)

		totalCourses := 0
		for _, sem := range rm {
			load, ok := sem["total_load"].(float64)
			assert.True(t, ok)
			assert.LessOrEqual(t, load, 6.0)

			courseIDs, ok := sem["course_ids"].([]string)
			assert.True(t, ok)
			totalCourses += len(courseIDs)
		}

		assert.Equal(t, 8, totalCourses)
		assert.LessOrEqual(t, len(rm), 8)
	})
}

func newSequentialPlannerData(courseCount int) (interfaces.StoreBase, uuid.UUID) {
	s := store.NewMemoryStore()
	s.Init("admin")

	major := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech"}
	s.CreateMajor(major)

	courseIDs := make([]uuid.UUID, 0, courseCount)
	for i := 0; i < courseCount; i++ {
		course := interfaces.CourseData{
			ID:                  uuid.New(),
			Title:               fmt.Sprintf("Course %02d", i+1),
			Description:         new("Generated"),
			AvailableSemesters:  nil,
			RecommendedSemester: new(i + 1),
			Workload:            3.0,
		}
		s.CreateCourse(course)
		courseIDs = append(courseIDs, course.ID)
		s.CreateMajorRequirement(interfaces.MajorRequirementData{
			ID:              uuid.New(),
			MajorID:         major.ID,
			CourseID:        course.ID,
			RequirementType: enums.RequirementTypeMajorCore,
		})

		if i > 0 {
			s.CreateCourseDependency(interfaces.CourseDependencyData{
				ID:               uuid.New(),
				CourseID:         course.ID,
				RequiredCourseID: courseIDs[i-1],
				DependencyType:   enums.DependencyTypePrerequisite,
			})
		}
	}

	return s, major.ID
}

func newOptimizationTradeoffData() (interfaces.StoreBase, uuid.UUID) {
	s := store.NewMemoryStore()
	s.Init("admin")

	heavy := interfaces.CourseData{ID: uuid.New(), Title: "Heavy Course", Description: new("Heavy"), RecommendedSemester: new(1), Workload: 6.0}
	mediumA := interfaces.CourseData{ID: uuid.New(), Title: "Medium A", Description: new("Medium"), RecommendedSemester: new(1), Workload: 3.0}
	mediumB := interfaces.CourseData{ID: uuid.New(), Title: "Medium B", Description: new("Medium"), RecommendedSemester: new(1), Workload: 3.0}

	s.CreateCourse(heavy)
	s.CreateCourse(mediumA)
	s.CreateCourse(mediumB)

	majorID := createMajorWithRequirements(s, heavy.ID, mediumA.ID, mediumB.ID)

	for i := 0; i < 3; i++ {
		unlockCourse := interfaces.CourseData{ID: uuid.New(), Title: fmt.Sprintf("Heavy Unlock %d", i+1), Description: new("Unlock"), Workload: 3.0}
		s.CreateCourse(unlockCourse)
		s.CreateCourseDependency(interfaces.CourseDependencyData{
			ID:               uuid.New(),
			CourseID:         unlockCourse.ID,
			RequiredCourseID: heavy.ID,
			DependencyType:   enums.DependencyTypePrerequisite,
		})
	}

	for i := 0; i < 2; i++ {
		unlockCourse := interfaces.CourseData{ID: uuid.New(), Title: fmt.Sprintf("Medium A Unlock %d", i+1), Description: new("Unlock"), Workload: 3.0}
		s.CreateCourse(unlockCourse)
		s.CreateCourseDependency(interfaces.CourseDependencyData{
			ID:               uuid.New(),
			CourseID:         unlockCourse.ID,
			RequiredCourseID: mediumA.ID,
			DependencyType:   enums.DependencyTypePrerequisite,
		})
	}

	for i := 0; i < 2; i++ {
		unlockCourse := interfaces.CourseData{ID: uuid.New(), Title: fmt.Sprintf("Medium B Unlock %d", i+1), Description: new("Unlock"), Workload: 3.0}
		s.CreateCourse(unlockCourse)
		s.CreateCourseDependency(interfaces.CourseDependencyData{
			ID:               uuid.New(),
			CourseID:         unlockCourse.ID,
			RequiredCourseID: mediumB.ID,
			DependencyType:   enums.DependencyTypePrerequisite,
		})
	}

	return s, majorID
}

func TestGenerateRoadmapWithPlannedSemesters(t *testing.T) {
	runRoadmapPlannerTests(t, func(t *testing.T, factory plannerFactory) {
		s := store.NewMemoryStore()
		s.Init("admin")
		defer s.Close()

		c1 := interfaces.CourseData{ID: uuid.New(), Title: "Course 1", Workload: 3.0}
		c2 := interfaces.CourseData{ID: uuid.New(), Title: "Course 2", Workload: 3.0}
		c3 := interfaces.CourseData{ID: uuid.New(), Title: "Course 3", Workload: 3.0}

		s.CreateCourse(c1)
		s.CreateCourse(c2)
		s.CreateCourse(c3)

		// c1 -> c2 -> c3
		s.CreateCourseDependency(interfaces.CourseDependencyData{ID: uuid.New(), CourseID: c2.ID, RequiredCourseID: c1.ID, DependencyType: enums.DependencyTypePrerequisite})
		s.CreateCourseDependency(interfaces.CourseDependencyData{ID: uuid.New(), CourseID: c3.ID, RequiredCourseID: c2.ID, DependencyType: enums.DependencyTypePrerequisite})

		majorID := createMajorWithRequirements(s, c1.ID, c2.ID, c3.ID)
		planner := createPlannerForTest(t, factory.kind, s)

		// We plan c2 for semester 5
		planned := []schemas.PlannedSemester{
			{Semester: 5, CourseIDs: []uuid.UUID{c2.ID}},
		}

		roadmap, err := planner.GenerateRoadmap(nil, planned, majorID, 1, 12.0, 0)
		assert.NoError(t, err)

		rm := roadmap.([]map[string]interface{})

		// Find when c2 is scheduled
		c2Sem := -1
		c3Sem := -1
		for _, semData := range rm {
			sem := semData["semester"].(int)
			courseIDs := semData["course_ids"].([]string)
			for _, cid := range courseIDs {
				if cid == c2.ID.String() {
					c2Sem = sem
				}
				if cid == c3.ID.String() {
					c3Sem = sem
				}
			}
		}

		// c2 must be strictly in semester 5
		assert.Equal(t, 5, c2Sem, "c2 should be forced into semester 5")
		// c3 must be scheduled after c2 (semester 6 or later)
		assert.Greater(t, c3Sem, 5, "c3 should be scheduled after c2")
	})
}

func BenchmarkGenerateRoadmapImplementations(b *testing.B) {
	for _, factory := range roadmapPlannerFactories {
		b.Run(factory.name, func(b *testing.B) {
			s, majorID := newSequentialPlannerData(24)
			defer s.Close()
			planner := createPlannerForTest(b, factory.kind, s)

			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				_, err := planner.GenerateRoadmap(nil, nil, majorID, 1, 6.0, 0)
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}
