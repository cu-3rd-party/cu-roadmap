package api

import (
	"strconv"
	"strings"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
)

func parseCourseFilter(c *gin.Context) interfaces.CourseFilter {
	var f interfaces.CourseFilter

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
