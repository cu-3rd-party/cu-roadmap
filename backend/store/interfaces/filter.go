package interfaces

import (
	"strings"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
)

type CourseFilter struct {
	CohortYears []int
	Title       string
	CourseTypes []enums.CourseType
	Categories  []enums.CourseCategory
	WorkloadOp  string
	WorkloadVal float64
}

func FilterCourses(courses []CourseData, f CourseFilter) []CourseData {
	if len(f.CohortYears) == 0 && f.Title == "" && len(f.CourseTypes) == 0 && len(f.Categories) == 0 && f.WorkloadOp == "" {
		return courses
	}

	res := make([]CourseData, 0, len(courses))
	for _, course := range courses {
		if !matchCohortYears(course, f.CohortYears) {
			continue
		}
		if !matchTitle(course, f.Title) {
			continue
		}
		if !matchCourseTypes(course, f.CourseTypes) {
			continue
		}
		if !matchCategories(course, f.Categories) {
			continue
		}
		if !matchWorkload(course, f.WorkloadOp, f.WorkloadVal) {
			continue
		}
		res = append(res, course)
	}
	return res
}

func matchCohortYears(course CourseData, years []int) bool {
	if len(years) == 0 {
		return true
	}
	if len(course.AllowedCohorts) == 0 {
		return true
	}
	for _, cy := range years {
		for _, ac := range course.AllowedCohorts {
			if ac == cy {
				return true
			}
		}
	}
	return false
}

func matchTitle(course CourseData, title string) bool {
	if title == "" {
		return true
	}
	return strings.Contains(strings.ToLower(course.Title), strings.ToLower(title))
}

func matchCourseTypes(course CourseData, types []enums.CourseType) bool {
	if len(types) == 0 {
		return true
	}
	for _, ct := range types {
		if ct == course.CourseType {
			return true
		}
	}
	return false
}

func matchCategories(course CourseData, categories []enums.CourseCategory) bool {
	if len(categories) == 0 {
		return true
	}
	for _, cat := range categories {
		if cat == course.Category {
			return true
		}
	}
	return false
}

func matchWorkload(course CourseData, op string, val float64) bool {
	if op == "" {
		return true
	}
	switch op {
	case "<":
		return course.Workload < val
	case "=":
		return course.Workload == val
	case ">":
		return course.Workload > val
	default:
		return true
	}
}
