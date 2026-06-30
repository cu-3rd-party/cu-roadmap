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

func roadmapToValidationInput(roadmap []map[string]interface{}) []map[string]interface{} {
	validationInput := make([]map[string]interface{}, 0, len(roadmap))
	for _, sem := range roadmap {
		validationInput = append(validationInput, map[string]interface{}{
			"semester":   sem["semester"],
			"course_ids": sem["course_ids"],
		})
	}
	return validationInput
}

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

	c1 := interfaces.CourseData{ID: uuid.New(), Title: "Python Basics", Description: new("Intro"), AvailableSemesters: []int{1, 2}, RecommendedSemester: new(1), Workload: 4.0, Category: enums.CourseCategorySTEM}
	c2 := interfaces.CourseData{ID: uuid.New(), Title: "Advanced Python", Description: new("Advanced"), AvailableSemesters: []int{3, 4}, RecommendedSemester: new(3), Workload: 5.0, Category: enums.CourseCategorySTEM}
	c3 := interfaces.CourseData{ID: uuid.New(), Title: "Algorithms", Description: new("Algos"), AvailableSemesters: []int{1, 3}, RecommendedSemester: new(2), Workload: 6.0, Category: enums.CourseCategorySTEM}

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

func TestGenerateRoadmapForcesFundamentalsObyazCourseIntoExclusiveSemester(t *testing.T) {
	runRoadmapPlannerTests(t, func(t *testing.T, factory plannerFactory) {
		s := store.NewMemoryStore()
		s.Init("admin")
		defer s.Close()

		prereq := interfaces.CourseData{ID: uuid.New(), Title: "Prereq", Description: new("Prereq"), AvailableSemesters: []int{8}, Workload: 3.0, Category: enums.CourseCategoryFundamentals}
		forced := interfaces.CourseData{
			ID:                  uuid.New(),
			Title:               "Forced Fundamentals",
			Description:         new("Forced"),
			AvailableSemesters:  []int{4},
			Workload:            3.0,
			Category:            enums.CourseCategoryFundamentals,
			CourseType:          enums.CourseTypeMandatory,
			AnalogGroup:         "ОБЯЗ: Fundamentals",
			Prerequisites:       []uuid.UUID{prereq.ID},
			RecommendedSemester: new(int),
		}
		*forced.RecommendedSemester = 4

		_, _ = s.CreateCourse(prereq)
		_, _ = s.CreateCourse(forced)

		majorID := createMajorWithRequirements(s, forced.ID)
		_, _ = s.CreateCourseDependency(interfaces.CourseDependencyData{ID: uuid.New(), CourseID: forced.ID, RequiredCourseID: prereq.ID, DependencyType: enums.DependencyTypePrerequisite})

		planner := createPlannerForTest(t, factory.kind, s)
		roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, nil, majorID, nil, 1, 12.0, 0)
		assert.NoError(t, err)

		rm := roadmap.([]map[string]interface{})
		found := false
		for _, sem := range rm {
			if ids, ok := sem["course_ids"].([]string); ok {
				for _, id := range ids {
					if id == forced.ID.String() {
						assert.Equal(t, 4, sem["semester"])
						found = true
					}
				}
			}
		}
		assert.True(t, found, "forced fundamentals course should be scheduled into its exclusive semester")
	})
}

func TestGenerateRoadmapBackfillsForcedFundamentalsCourseIntoPastSemester(t *testing.T) {
	runRoadmapPlannerTests(t, func(t *testing.T, factory plannerFactory) {
		s := store.NewMemoryStore()
		s.Init("admin")
		defer s.Close()

		forced := interfaces.CourseData{
			ID:                 uuid.New(),
			Title:              "Forced Past Fundamentals",
			Description:        new("Forced"),
			AvailableSemesters: []int{2},
			Workload:           3.0,
			Category:           enums.CourseCategoryFundamentals,
			CourseType:         enums.CourseTypeMandatory,
			AnalogGroup:        "ОБЯЗ: Fundamentals",
		}

		_, _ = s.CreateCourse(forced)
		majorID := createMajorWithRequirements(s, forced.ID)

		planner := createPlannerForTest(t, factory.kind, s)
		roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, nil, majorID, nil, 3, 12.0, 0)
		assert.NoError(t, err)

		rm := roadmap.([]map[string]interface{})
		foundSemester := -1
		for _, sem := range rm {
			if ids, ok := sem["course_ids"].([]string); ok {
				for _, id := range ids {
					if id == forced.ID.String() {
						foundSemester = sem["semester"].(int)
						break
					}
				}
			}
			if foundSemester != -1 {
				break
			}
		}

		assert.Equal(t, 2, foundSemester, "forced fundamentals course should be backfilled into its actual past semester")
	})
}

func TestGenerateRoadmapProducesValidatorCleanPlanForMandatorySemesters(t *testing.T) {
	runRoadmapPlannerTests(t, func(t *testing.T, factory plannerFactory) {
		s := store.NewMemoryStore()
		s.Init("admin")
		defer s.Close()

		major := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech"}
		s.CreateMajor(major)
		majorID := major.ID

		mandatoryCourses := []interfaces.CourseData{
			{ID: uuid.New(), Title: "Statehood", AvailableSemesters: []int{1}, Workload: 1.0, Category: enums.CourseCategoryFundamentals, CourseType: enums.CourseTypeMandatory, AnalogGroup: "ОБЯЗ: Statehood"},
			{ID: uuid.New(), Title: "English 1", AvailableSemesters: []int{1}, Workload: 1.0, Category: enums.CourseCategoryFundamentals, CourseType: enums.CourseTypeMandatory, AnalogGroup: "ОБЯЗ: English 1"},
			{ID: uuid.New(), Title: "English 2", AvailableSemesters: []int{2}, Workload: 1.0, Category: enums.CourseCategoryFundamentals, CourseType: enums.CourseTypeMandatory, AnalogGroup: "ОБЯЗ: English 2"},
			{ID: uuid.New(), Title: "English 3", AvailableSemesters: []int{3}, Workload: 1.0, Category: enums.CourseCategoryFundamentals, CourseType: enums.CourseTypeMandatory, AnalogGroup: "ОБЯЗ: English 3"},
			{ID: uuid.New(), Title: "English 4", AvailableSemesters: []int{4}, Workload: 1.0, Category: enums.CourseCategoryFundamentals, CourseType: enums.CourseTypeMandatory, AnalogGroup: "ОБЯЗ: English 4"},
			{ID: uuid.New(), Title: "PE 1", AvailableSemesters: []int{1}, Workload: 1.0, Category: enums.CourseCategoryFundamentals, CourseType: enums.CourseTypeMandatory, AnalogGroup: "ОБЯЗ: PE 1"},
			{ID: uuid.New(), Title: "PE 2", AvailableSemesters: []int{2}, Workload: 1.0, Category: enums.CourseCategoryFundamentals, CourseType: enums.CourseTypeMandatory, AnalogGroup: "ОБЯЗ: PE 2"},
			{ID: uuid.New(), Title: "PE 3", AvailableSemesters: []int{3}, Workload: 1.0, Category: enums.CourseCategoryFundamentals, CourseType: enums.CourseTypeMandatory, AnalogGroup: "ОБЯЗ: PE 3"},
			{ID: uuid.New(), Title: "PE 4", AvailableSemesters: []int{4}, Workload: 1.0, Category: enums.CourseCategoryFundamentals, CourseType: enums.CourseTypeMandatory, AnalogGroup: "ОБЯЗ: PE 4"},
			{ID: uuid.New(), Title: "BJD", AvailableSemesters: []int{2}, Workload: 1.0, Category: enums.CourseCategoryFundamentals, CourseType: enums.CourseTypeMandatory, AnalogGroup: "ОБЯЗ: BJD"},
			{ID: uuid.New(), Title: "History", AvailableSemesters: []int{4}, Workload: 1.0, Category: enums.CourseCategoryFundamentals, CourseType: enums.CourseTypeMandatory, AnalogGroup: "ОБЯЗ: History"},
		}

		for _, course := range mandatoryCourses {
			s.CreateCourse(course)
		}

		// The planner requires at least one explicit major requirement before global injections kick in.
		s.CreateMajorRequirement(interfaces.MajorRequirementData{
			ID:              uuid.New(),
			MajorID:         majorID,
			CourseID:        mandatoryCourses[0].ID,
			RequirementType: enums.RequirementTypeMajorCore,
		})

		stemCourses := []interfaces.CourseData{
			{ID: uuid.New(), Title: "Science Studio", AvailableSemesters: []int{1, 2, 3, 4}, Workload: 1.0, Category: enums.CourseCategorySTEM, AnalogGroup: "Научная студия"},
			{ID: uuid.New(), Title: "Business Studio", AvailableSemesters: []int{1, 2, 3, 4}, Workload: 1.0, Category: enums.CourseCategorySTEM, AnalogGroup: "Бизнес студия"},
			{ID: uuid.New(), Title: "STEM 2", AvailableSemesters: []int{2}, Workload: 1.0, Category: enums.CourseCategorySTEM},
			{ID: uuid.New(), Title: "STEM 3", AvailableSemesters: []int{3}, Workload: 1.0, Category: enums.CourseCategorySTEM},
			{ID: uuid.New(), Title: "STEM 4", AvailableSemesters: []int{4}, Workload: 1.0, Category: enums.CourseCategorySTEM},
		}
		for _, course := range stemCourses {
			s.CreateCourse(course)
		}

		softCourses := []interfaces.CourseData{
			{ID: uuid.New(), Title: "Soft 2", AvailableSemesters: []int{2}, Workload: 1.0, Category: enums.CourseCategorySoft},
			{ID: uuid.New(), Title: "Soft 3", AvailableSemesters: []int{3}, Workload: 1.0, Category: enums.CourseCategorySoft},
			{ID: uuid.New(), Title: "Soft 4", AvailableSemesters: []int{4}, Workload: 1.0, Category: enums.CourseCategorySoft},
		}
		for _, course := range softCourses {
			s.CreateCourse(course)
		}

		planner := createPlannerForTest(t, factory.kind, s)
		roadmapRaw, err := planner.GenerateRoadmap(nil, nil, majorID, nil, 5, 20.0, 0)
		assert.NoError(t, err)

		roadmap := roadmapRaw.([]map[string]interface{})
		validator, err := CreateValidatorFromStore(s)
		assert.NoError(t, err)

		results := validator.ValidateFullRoadmap(roadmapToValidationInput(roadmap), make(map[uuid.UUID]bool), 20.0, nil)
		assert.NotEmpty(t, results)
		for _, result := range results {
			assert.True(t, result["valid"].(bool), "semester %v should be valid, got messages %v", result["semester"], result["messages"])
			assert.Empty(t, result["messages"])
		}

		coursesBySemester := make(map[int][]string)
		for _, sem := range roadmap {
			coursesBySemester[sem["semester"].(int)] = sem["course_ids"].([]string)
		}
		assert.Contains(t, coursesBySemester[1], mandatoryCourses[1].ID.String())
		assert.Contains(t, coursesBySemester[2], mandatoryCourses[2].ID.String())
		assert.Contains(t, coursesBySemester[3], mandatoryCourses[3].ID.String())
		assert.Contains(t, coursesBySemester[4], mandatoryCourses[4].ID.String())
		assert.Contains(t, coursesBySemester[4], mandatoryCourses[10].ID.String())
	})
}

func TestGenerateRoadmapPrioritizesCommonMandatoryCoursesBeforeProfileCourses(t *testing.T) {
	runRoadmapPlannerTests(t, func(t *testing.T, factory plannerFactory) {
		s := store.NewMemoryStore()
		s.Init("admin")
		defer s.Close()

		major := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech"}
		s.CreateMajor(major)

		commonA := interfaces.CourseData{ID: uuid.New(), Title: "Common Mandatory A", AvailableSemesters: []int{1, 2}, Workload: 3.0, Category: enums.CourseCategoryFundamentals}
		commonB := interfaces.CourseData{ID: uuid.New(), Title: "Common Mandatory B", AvailableSemesters: []int{1, 2}, Workload: 3.0, Category: enums.CourseCategoryFundamentals}
		profileA := interfaces.CourseData{ID: uuid.New(), Title: "Profile A", AvailableSemesters: []int{1, 2, 3}, Workload: 4.0, Category: enums.CourseCategorySWE}
		profileB := interfaces.CourseData{ID: uuid.New(), Title: "Profile B", AvailableSemesters: []int{1, 2, 3}, Workload: 4.0, Category: enums.CourseCategorySWE}
		unlock1 := interfaces.CourseData{ID: uuid.New(), Title: "Unlock 1", AvailableSemesters: []int{2, 3}, Workload: 2.0, Category: enums.CourseCategorySWE}
		unlock2 := interfaces.CourseData{ID: uuid.New(), Title: "Unlock 2", AvailableSemesters: []int{2, 3}, Workload: 2.0, Category: enums.CourseCategorySWE}

		for _, course := range []interfaces.CourseData{commonA, commonB, profileA, profileB, unlock1, unlock2} {
			s.CreateCourse(course)
		}

		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: major.ID, CourseID: commonA.ID, RequirementType: enums.RequirementTypeUniversity})
		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: major.ID, CourseID: commonB.ID, RequirementType: enums.RequirementTypeUniversity})
		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: major.ID, CourseID: profileA.ID, RequirementType: enums.RequirementTypeMajorCore})
		s.CreateMajorRequirement(interfaces.MajorRequirementData{ID: uuid.New(), MajorID: major.ID, CourseID: profileB.ID, RequirementType: enums.RequirementTypeMajorCore})

		s.CreateCourseDependency(interfaces.CourseDependencyData{ID: uuid.New(), CourseID: unlock1.ID, RequiredCourseID: profileA.ID, DependencyType: enums.DependencyTypePrerequisite})
		s.CreateCourseDependency(interfaces.CourseDependencyData{ID: uuid.New(), CourseID: unlock2.ID, RequiredCourseID: profileB.ID, DependencyType: enums.DependencyTypePrerequisite})

		planner := createPlannerForTest(t, factory.kind, s)
		roadmapRaw, err := planner.GenerateRoadmap(nil, nil, major.ID, nil, 1, 6.0, 0)
		assert.NoError(t, err)

		roadmap := roadmapRaw.([]map[string]interface{})
		assert.NotEmpty(t, roadmap)

		semesterOne := roadmap[0]["course_ids"].([]string)
		assert.Contains(t, semesterOne, commonA.ID.String())
		assert.Contains(t, semesterOne, commonB.ID.String())
		assert.NotContains(t, semesterOne, profileA.ID.String())
		assert.NotContains(t, semesterOne, profileB.ID.String())

		laterSemesters := make([]string, 0)
		for _, sem := range roadmap[1:] {
			laterSemesters = append(laterSemesters, sem["course_ids"].([]string)...)
		}
		assert.Contains(t, laterSemesters, profileA.ID.String())
		assert.Contains(t, laterSemesters, profileB.ID.String())
	})
}

func TestGenerateRoadmapAllowsSequentialPrereqAndCoreqPair(t *testing.T) {
	runRoadmapPlannerTests(t, func(t *testing.T, factory plannerFactory) {
		s := store.NewMemoryStore()
		s.Init("admin")
		defer s.Close()

		base := interfaces.CourseData{ID: uuid.New(), Title: "Base", AvailableSemesters: []int{1, 2}, Workload: 4.0, Category: enums.CourseCategorySTEM}
		dependent := interfaces.CourseData{ID: uuid.New(), Title: "Dependent", AvailableSemesters: []int{1, 2}, Workload: 3.0, Category: enums.CourseCategorySTEM}
		_, _ = s.CreateCourse(base)
		_, _ = s.CreateCourse(dependent)
		_, _ = s.CreateCourseDependency(interfaces.CourseDependencyData{ID: uuid.New(), CourseID: dependent.ID, RequiredCourseID: base.ID, DependencyType: enums.DependencyTypePrerequisite})
		_, _ = s.CreateCourseDependency(interfaces.CourseDependencyData{ID: uuid.New(), CourseID: dependent.ID, RequiredCourseID: base.ID, DependencyType: enums.DependencyTypeCorequisite})

		majorID := createMajorWithRequirements(s, dependent.ID)
		planner := createPlannerForTest(t, factory.kind, s)
		roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, nil, majorID, nil, 1, 12.0, 0)
		assert.NoError(t, err)

		rm := roadmap.([]map[string]interface{})
		assert.NotZero(t, len(rm))
		seenBase := false
		seenDependent := false
		for _, sem := range rm {
			if ids, ok := sem["course_ids"].([]string); ok {
				for _, id := range ids {
					if id == base.ID.String() {
						seenBase = true
					}
					if id == dependent.ID.String() {
						seenDependent = true
					}
				}
			}
		}
		assert.True(t, seenBase)
		assert.True(t, seenDependent)
	})
}

func TestGenerateRoadmapBasic(t *testing.T) {
	runRoadmapPlannerTests(t, func(t *testing.T, factory plannerFactory) {
		s, c1, c2, c3 := newTestData()
		defer s.Close()

		majorID := createMajorWithRequirements(s, c1.ID, c2.ID)
		_ = c3

		planner := createPlannerForTest(t, factory.kind, s)
		roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, nil, majorID, nil, 1, 12.0, 0)
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
		roadmap, err := planner.GenerateRoadmap([]uuid.UUID{c1.ID}, nil, majorID, nil, 3, 12.0, 0)
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
		roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, nil, uuid.New(), nil, 1, 12.0, 0)
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
		roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, nil, majorID, nil, 1, 5.0, 0)
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
		roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, nil, uuid.New(), nil, 1, 12.0, 0)
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
		roadmap, err := planner.GenerateRoadmap([]uuid.UUID{c1.ID, c2.ID}, nil, majorID, nil, 1, 12.0, 0)
		assert.NoError(t, err)
		assert.IsType(t, []map[string]interface{}{}, roadmap)
	})
}

func TestGenerateRoadmapOptimizationStrategiesDiverge(t *testing.T) {
	s, majorID := newOptimizationTradeoffData()
	defer s.Close()

	results := make(map[PlannerKind][]string)
	runRoadmapPlannerTestsWithStore(t, s, func(t *testing.T, factory plannerFactory, planner RoadmapPlanner) {
		roadmap, err := planner.GenerateRoadmap(nil, nil, majorID, nil, 1, 6.0, 0)
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
		roadmap, err := planner.GenerateRoadmap(nil, nil, majorID, nil, 1, 6.0, 0)
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

func TestGenerateRoadmapRepeatsOddEvenAvailabilityBeyondSemesterEight(t *testing.T) {
	s := store.NewMemoryStore()
	s.Init("admin")
	defer s.Close()

	major := interfaces.MajorData{ID: uuid.New(), Title: "SE", School: "Tech"}
	s.CreateMajor(major)

	courseIDs := make([]uuid.UUID, 0, 7)
	for i := 0; i < 6; i++ {
		course := interfaces.CourseData{
			ID:                 uuid.New(),
			Title:              fmt.Sprintf("Prereq %d", i+1),
			Description:        new("Generated"),
			AvailableSemesters: []int{1, 2, 3, 4, 5, 6, 7, 8},
			Workload:           3.0,
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

	target := interfaces.CourseData{
		ID:                 uuid.New(),
		Title:              "Odd Only Final",
		Description:        new("Generated"),
		AvailableSemesters: []int{1, 3, 5, 7},
		Workload:           3.0,
	}
	s.CreateCourse(target)
	s.CreateMajorRequirement(interfaces.MajorRequirementData{
		ID:              uuid.New(),
		MajorID:         major.ID,
		CourseID:        target.ID,
		RequirementType: enums.RequirementTypeMajorCore,
	})
	s.CreateCourseDependency(interfaces.CourseDependencyData{
		ID:               uuid.New(),
		CourseID:         target.ID,
		RequiredCourseID: courseIDs[len(courseIDs)-1],
		DependencyType:   enums.DependencyTypePrerequisite,
	})

	runRoadmapPlannerTestsWithStore(t, s, func(t *testing.T, factory plannerFactory, planner RoadmapPlanner) {
		roadmap, err := planner.GenerateRoadmap(nil, nil, major.ID, nil, 3, 3.0, 0)
		assert.NoError(t, err)

		rm := roadmap.([]map[string]interface{})
		assert.NotEmpty(t, rm)

		last := rm[len(rm)-1]
		assert.Equal(t, 9, last["semester"])
		assert.Contains(t, last["course_ids"].([]string), target.ID.String())
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

		roadmap, err := planner.GenerateRoadmap(nil, planned, majorID, nil, 1, 12.0, 0)
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
				_, err := planner.GenerateRoadmap(nil, nil, majorID, nil, 1, 6.0, 0)
				if err != nil {
					b.Fatal(err)
				}
			}
		})
	}
}
