package helpers

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func CourseToResponse(course interfaces.CourseData) gin.H {
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

func ToCourseModel(course interfaces.CourseData) models.Course {
	return models.Course{
		ID:                  course.ID,
		Title:               course.Title,
		Description:         course.Description,
		HandbookLink:        course.HandbookLink,
		CourseType:          course.CourseType,
		Category:            course.Category,
		AllowedCohorts:      course.AllowedCohorts,
		AvailableSemesters:  course.AvailableSemesters,
		RecommendedSemester: course.RecommendedSemester,
		Workload:            course.Workload,
		CsatMetric:          course.CsatMetric,
	}
}

func ToCourseData(c *models.Course) interfaces.CourseData {
	cd := interfaces.CourseData{
		ID:                  c.ID,
		Title:               c.Title,
		Description:         c.Description,
		HandbookLink:        c.HandbookLink,
		CourseType:          c.CourseType,
		Category:            c.Category,
		AllowedCohorts:      c.AllowedCohorts,
		AvailableSemesters:  c.AvailableSemesters,
		RecommendedSemester: c.RecommendedSemester,
		Workload:            c.Workload,
		CsatMetric:          c.CsatMetric,
	}
	for _, dep := range c.CourseDependencies {
		if dep.DependencyType == enums.DependencyTypePrerequisite {
			cd.Prerequisites = append(cd.Prerequisites, dep.RequiredCourseID)
		} else if dep.DependencyType == enums.DependencyTypeCorequisite {
			cd.Corequisites = append(cd.Corequisites, dep.RequiredCourseID)
		}
	}
	return cd
}
