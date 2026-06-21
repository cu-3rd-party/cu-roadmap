package service

import (
	"testing"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/schemas"
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestAnalogGroupOnlyOneRecommended(t *testing.T) {
	s := store.NewMemoryStore()
	s.Init("admin")

	// Create three analog courses (like синий, красный, черный матан)
	blueMatan := interfaces.CourseData{
		ID:                 uuid.New(),
		Title:              "Синий матан",
		AvailableSemesters: []int{1, 2},
		Workload:           4.0,
		AnalogGroup:        "Матан1",
		Category:           enums.CourseCategoryFundamentals,
		CourseType:         enums.CourseTypeMandatory,
	}
	redMatan := interfaces.CourseData{
		ID:                 uuid.New(),
		Title:              "Красный матан",
		AvailableSemesters: []int{1, 2},
		Workload:           4.0,
		AnalogGroup:        "Матан1",
		Category:           enums.CourseCategoryFundamentals,
		CourseType:         enums.CourseTypeMandatory,
	}
	blackMatan := interfaces.CourseData{
		ID:                 uuid.New(),
		Title:              "Черный матан",
		AvailableSemesters: []int{1, 2},
		Workload:           4.0,
		AnalogGroup:        "Матан1",
		Category:           enums.CourseCategoryFundamentals,
		CourseType:         enums.CourseTypeMandatory,
	}

	s.CreateCourse(blueMatan)
	s.CreateCourse(redMatan)
	s.CreateCourse(blackMatan)

	// Create a major with all three courses
	major := interfaces.MajorData{ID: uuid.New(), Title: "Test Major", School: "Tech"}
	s.CreateMajor(major)

	s.CreateMajorRequirement(interfaces.MajorRequirementData{
		ID:              uuid.New(),
		MajorID:         major.ID,
		CourseID:        blueMatan.ID,
		RequirementType: enums.RequirementTypeMajorCore,
	})
	s.CreateMajorRequirement(interfaces.MajorRequirementData{
		ID:              uuid.New(),
		MajorID:         major.ID,
		CourseID:        redMatan.ID,
		RequirementType: enums.RequirementTypeMajorCore,
	})
	s.CreateMajorRequirement(interfaces.MajorRequirementData{
		ID:              uuid.New(),
		MajorID:         major.ID,
		CourseID:        blackMatan.ID,
		RequirementType: enums.RequirementTypeMajorCore,
	})

	// Test 1: No courses passed - should get only one from the group
	planner, err := NewRoadmapPlanner(PlannerKindGreedy, s)
	assert.NoError(t, err)

	roadmap, err := planner.GenerateRoadmap([]uuid.UUID{}, []schemas.PlannedSemester{}, major.ID, 1, 10.0, 0)
	assert.NoError(t, err)

	// Count how many courses from the analog group are in the roadmap
	matanCount := 0
	semesters := roadmap.([]map[string]interface{})
	for _, sem := range semesters {
		courseIDs := sem["course_ids"].([]string)
		for _, cidStr := range courseIDs {
			cidUUID, _ := uuid.Parse(cidStr)
			if cidUUID == blueMatan.ID || cidUUID == redMatan.ID || cidUUID == blackMatan.ID {
				matanCount++
			}
		}
	}

	assert.Equal(t, 1, matanCount, "Should recommend only one course from analog group")

	// Test 2: Student passed blue matan - should not recommend red or black
	passedCourses := []uuid.UUID{blueMatan.ID}
	roadmap2, err := planner.GenerateRoadmap(passedCourses, []schemas.PlannedSemester{}, major.ID, 1, 10.0, 0)
	assert.NoError(t, err)

	matanCount2 := 0
	semesters2 := roadmap2.([]map[string]interface{})
	for _, sem := range semesters2 {
		courseIDs := sem["course_ids"].([]string)
		for _, cidStr := range courseIDs {
			cidUUID, _ := uuid.Parse(cidStr)
			if cidUUID == redMatan.ID || cidUUID == blackMatan.ID {
				matanCount2++
			}
		}
	}

	assert.Equal(t, 0, matanCount2, "Should not recommend other courses from analog group when one is passed")

	// Test 3: Student planned red matan - should not recommend blue or black
	plannedSemesters := []schemas.PlannedSemester{
		{
			Semester:  1,
			CourseIDs: []uuid.UUID{redMatan.ID},
		},
	}
	roadmap3, err := planner.GenerateRoadmap([]uuid.UUID{}, plannedSemesters, major.ID, 2, 10.0, 0)
	assert.NoError(t, err)

	matanCount3 := 0
	semesters3 := roadmap3.([]map[string]interface{})
	for _, sem := range semesters3 {
		courseIDs := sem["course_ids"].([]string)
		for _, cidStr := range courseIDs {
			cidUUID, _ := uuid.Parse(cidStr)
			if cidUUID == blueMatan.ID || cidUUID == blackMatan.ID {
				matanCount3++
			}
		}
	}

	assert.Equal(t, 0, matanCount3, "Should not recommend other courses from analog group when one is planned")
}

func TestAnalogGroupDoesNotMarkVirtuallyPassedAsPassed(t *testing.T) {
	s := store.NewMemoryStore()
	s.Init("admin")
	defer s.Close()

	// A and B are analogs
	courseA := interfaces.CourseData{
		ID:                 uuid.New(),
		Title:              "Course A (Base)",
		AvailableSemesters: []int{1, 2},
		Workload:           3.0,
		AnalogGroup:        "Group1",
		Category:           enums.CourseCategoryFundamentals,
		CourseType:         enums.CourseTypeMandatory,
	}
	courseB := interfaces.CourseData{
		ID:                 uuid.New(),
		Title:              "Course B (Advanced)",
		AvailableSemesters: []int{1, 2},
		Workload:           3.0,
		AnalogGroup:        "Group1",
		Category:           enums.CourseCategoryFundamentals,
		CourseType:         enums.CourseTypeMandatory,
	}
	// Course C requires Course B as prerequisite
	courseC := interfaces.CourseData{
		ID:                 uuid.New(),
		Title:              "Course C (Postrequisite)",
		AvailableSemesters: []int{3, 4},
		Workload:           3.0,
		Category:           enums.CourseCategoryFundamentals,
		CourseType:         enums.CourseTypeMandatory,
	}

	s.CreateCourse(courseA)
	s.CreateCourse(courseB)
	s.CreateCourse(courseC)

	s.CreateCourseDependency(interfaces.CourseDependencyData{
		ID:               uuid.New(),
		CourseID:         courseC.ID,
		RequiredCourseID: courseB.ID,
		DependencyType:   enums.DependencyTypePrerequisite,
	})

	major := interfaces.MajorData{ID: uuid.New(), Title: "Test Major", School: "Tech"}
	s.CreateMajor(major)

	// All three are in the major requirements
	s.CreateMajorRequirement(interfaces.MajorRequirementData{
		ID:              uuid.New(),
		MajorID:         major.ID,
		CourseID:        courseA.ID,
		RequirementType: enums.RequirementTypeMajorCore,
	})
	s.CreateMajorRequirement(interfaces.MajorRequirementData{
		ID:              uuid.New(),
		MajorID:         major.ID,
		CourseID:        courseB.ID,
		RequirementType: enums.RequirementTypeMajorCore,
	})
	s.CreateMajorRequirement(interfaces.MajorRequirementData{
		ID:              uuid.New(),
		MajorID:         major.ID,
		CourseID:        courseC.ID,
		RequirementType: enums.RequirementTypeMajorCore,
	})

	planner, err := NewRoadmapPlanner(PlannerKindGreedy, s)
	assert.NoError(t, err)

	// Student passed Course A
	passedCourses := []uuid.UUID{courseA.ID}
	roadmap, err := planner.GenerateRoadmap(passedCourses, []schemas.PlannedSemester{}, major.ID, 1, 10.0, 0)
	assert.NoError(t, err)

	// Since student passed A, the Group1 requirement is fulfilled.
	// But C requires B, and B was not taken.
	// The planner must schedule B, and then C.
	semesters := roadmap.([]map[string]interface{})
	
	hasB := false
	hasC := false
	bSemester := -1
	cSemester := -1
	for _, sem := range semesters {
		semNum := sem["semester"].(int)
		courseIDs := sem["course_ids"].([]string)
		for _, cidStr := range courseIDs {
			cidUUID, _ := uuid.Parse(cidStr)
			if cidUUID == courseB.ID {
				hasB = true
				bSemester = semNum
			}
			if cidUUID == courseC.ID {
				hasC = true
				cSemester = semNum
			}
		}
	}

	assert.True(t, hasB, "Course B must be scheduled because Course C depends on it")
	assert.True(t, hasC, "Course C must be scheduled")
	assert.True(t, bSemester < cSemester, "Course B must be scheduled before Course C")
}
