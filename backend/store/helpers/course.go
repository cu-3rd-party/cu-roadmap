package helpers

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/store"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func CourseToResponse(course store.CourseData) gin.H {
	return gin.H{
		"id":                   course.ID.String(),
		"title":                course.Title,
		"description":          course.Description,
		"handbook_link":        course.HandbookLink,
		"course_type":          string(course.CourseType),
		"category":             string(course.Category),
		"available_semesters":  course.AvailableSemesters,
		"allowed_cohorts":      course.AllowedCohorts,
		"recommended_semester": course.RecommendedSemester,
		"workload":             course.Workload,
		"prerequisites":        CourseUUIDsToStrings(course.Prerequisites),
		"corequisites":         CourseUUIDsToStrings(course.Corequisites),
	}
}

func CourseUUIDsToStrings(ids []uuid.UUID) []string {
	res := make([]string, len(ids))
	for i, id := range ids {
		res[i] = id.String()
	}
	return res
}
