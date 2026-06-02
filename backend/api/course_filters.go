package api

import (
	"strconv"
	"strings"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
)

type CourseFilter struct {
	CohortYears []int
	Title       string
	CourseTypes []enums.CourseType
	Categories  []enums.CourseCategory
	WorkloadOp  string
	WorkloadVal float64
}

func parseCourseFilter(c *gin.Context) CourseFilter {
	var f CourseFilter

	if cy := c.Query("cohort_year"); cy != "" {
		for _, s := range strings.Split(cy, ",") {
			s = strings.TrimSpace(s)
			if year, err := strconv.Atoi(s); err == nil {
				f.CohortYears = append(f.CohortYears, year)
			}
		}
	}

	f.Title = c.Query("title")

	if ct := c.Query("course_type"); ct != "" {
		for _, s := range strings.Split(ct, ",") {
			s = strings.TrimSpace(s)
			f.CourseTypes = append(f.CourseTypes, enums.CourseType(s))
		}
	}

	if cat := c.Query("category"); cat != "" {
		for _, s := range strings.Split(cat, ",") {
			s = strings.TrimSpace(s)
			f.Categories = append(f.Categories, enums.CourseCategory(s))
		}
	}

	if wl := c.Query("workload"); wl != "" {
		for _, op := range []string{"<", "=", ">"} {
			if strings.HasPrefix(wl, op) {
				valStr := strings.TrimPrefix(wl, op)
				if val, err := strconv.ParseFloat(valStr, 64); err == nil {
					f.WorkloadOp = op
					f.WorkloadVal = val
				}
				break
			}
		}
	}

	return f
}

func filterCourses(courses []interfaces.CourseData, f CourseFilter) []interfaces.CourseData {
	if len(f.CohortYears) == 0 && f.Title == "" && len(f.CourseTypes) == 0 && len(f.Categories) == 0 && f.WorkloadOp == "" {
		return courses
	}

	res := make([]interfaces.CourseData, 0, len(courses))
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

func matchCohortYears(course interfaces.CourseData, years []int) bool {
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

func matchTitle(course interfaces.CourseData, title string) bool {
	if title == "" {
		return true
	}
	return strings.Contains(strings.ToLower(course.Title), strings.ToLower(title))
}

func matchCourseTypes(course interfaces.CourseData, types []enums.CourseType) bool {
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

func matchCategories(course interfaces.CourseData, categories []enums.CourseCategory) bool {
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

func matchWorkload(course interfaces.CourseData, op string, val float64) bool {
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
