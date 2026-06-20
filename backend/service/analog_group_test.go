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
