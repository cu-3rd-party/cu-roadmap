package helpers

import (
	"strings"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

func CourseToResponse(course interfaces.CourseData, deps []interfaces.CourseDependencyData, analogGroupSizes map[string]int) gin.H {
	seminarsWeek := course.SeminarsWeek
	lecturesWeek := course.LecturesWeek
	if seminarsWeek == 0 && lecturesWeek == 0 {
		seminarsWeek = 1
		lecturesWeek = 0
	}
	workload := course.Workload
	if workload == 0 {
		workload = float64(seminarsWeek + lecturesWeek)
	}
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
		"workload":             workload,
		"seminars_week":        seminarsWeek,
		"lectures_week":        lecturesWeek,
		"display_mode":         string(course.DisplayMode),
		"analog_group":         course.AnalogGroup,
		"fixed_semester":       inferFixedSemester(course, analogGroupSizes),
		"prerequisites":        buildPrerequisiteGroups(course, deps),
		"corequisites":         CourseUUIDsToStrings(course.Corequisites),
		"postrequisites":       CourseUUIDsToStrings(course.Postrequisites),
	}
}

func inferFixedSemester(course interfaces.CourseData, analogGroupSizes map[string]int) int {
	if len(course.AvailableSemesters) != 1 {
		return 0
	}
	if analogGroupSizes == nil {
		return 0
	}

	parts := strings.Split(course.AnalogGroup, ",")
	hasObyaz := false
	for _, part := range parts {
		groupKey := strings.ToLower(strings.TrimSpace(part))
		if groupKey == "" {
			continue
		}
		if strings.Contains(groupKey, "обяз") {
			hasObyaz = true
			if analogGroupSizes[groupKey] != 1 {
				return 0
			}
		}
	}
	if !hasObyaz {
		return 0
	}
	return course.AvailableSemesters[0]
}

func buildPrerequisiteGroups(course interfaces.CourseData, deps []interfaces.CourseDependencyData) interface{} {
	type prerequisiteGroup struct {
		courseIDs []uuid.UUID
	}

	var prerequisiteGroups []prerequisiteGroup
	groupIndexByAlt := make(map[int]int)

	for _, dep := range deps {
		if dep.DependencyType != enums.DependencyTypePrerequisite || dep.CourseID != course.ID {
			continue
		}

		var courseIDs []uuid.UUID
		if dep.RequiredCourseID != nil {
			courseIDs = append(courseIDs, *dep.RequiredCourseID)
		}

		for _, reqID := range courseIDs {
			idVal := reqID
			if dep.AlternativeGroup > 0 {
				idx, ok := groupIndexByAlt[dep.AlternativeGroup]
				if !ok {
					idx = len(prerequisiteGroups)
					groupIndexByAlt[dep.AlternativeGroup] = idx
					prerequisiteGroups = append(prerequisiteGroups, prerequisiteGroup{})
				}
				prerequisiteGroups[idx].courseIDs = append(prerequisiteGroups[idx].courseIDs, idVal)
				continue
			}

			prerequisiteGroups = append(prerequisiteGroups, prerequisiteGroup{courseIDs: []uuid.UUID{idVal}})
		}
	}

	if len(prerequisiteGroups) == 0 && len(course.Prerequisites) > 0 {
		res := make([]gin.H, 0, len(course.Prerequisites))
		for idx, prereq := range course.Prerequisites {
			res = append(res, gin.H{"group_id": idx, "course_ids": []string{prereq.String()}})
		}
		return res
	}

	res := make([]gin.H, 0, len(prerequisiteGroups))
	for idx, group := range prerequisiteGroups {
		res = append(res, gin.H{"group_id": idx, "course_ids": CourseUUIDsToStrings(group.courseIDs)})
	}
	return res
}

func CourseUUIDsToStrings(ids []uuid.UUID) []string {
	res := make([]string, len(ids))
	for i, id := range ids {
		res[i] = id.String()
	}
	return res
}

func toInt64Slice(in []int) pq.Int64Array {
	out := make(pq.Int64Array, len(in))
	for i, v := range in {
		out[i] = int64(v)
	}
	return out
}

func toIntSlice(in []int64) []int {
	if in == nil {
		return nil
	}
	out := make([]int, len(in))
	for i, v := range in {
		out[i] = int(v)
	}
	return out
}

func ToCourseModel(course interfaces.CourseData) models.Course {
	seminarsWeek := course.SeminarsWeek
	lecturesWeek := course.LecturesWeek
	if seminarsWeek == 0 && lecturesWeek == 0 {
		seminarsWeek = 1
		lecturesWeek = 0
	}
	workload := course.Workload
	if workload == 0 {
		workload = float64(seminarsWeek + lecturesWeek)
	}
	return models.Course{
		ID:                  course.ID,
		Title:               course.Title,
		Description:         course.Description,
		HandbookLink:        course.HandbookLink,
		CourseType:          course.CourseType,
		Category:            course.Category,
		AllowedCohorts:      toInt64Slice(course.AllowedCohorts),
		AvailableSemesters:  toInt64Slice(course.AvailableSemesters),
		RecommendedSemester: course.RecommendedSemester,
		Workload:            workload,
		SeminarsWeek:        seminarsWeek,
		LecturesWeek:        lecturesWeek,
		AnalogGroup:         course.AnalogGroup,
		CsatMetric:          course.CsatMetric,
		DisplayMode:         course.DisplayMode,
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
		AllowedCohorts:      toIntSlice(c.AllowedCohorts),
		AvailableSemesters:  toIntSlice(c.AvailableSemesters),
		RecommendedSemester: c.RecommendedSemester,
		Workload:            c.Workload,
		SeminarsWeek:        c.SeminarsWeek,
		LecturesWeek:        c.LecturesWeek,
		AnalogGroup:         c.AnalogGroup,
		CsatMetric:          c.CsatMetric,
		DisplayMode:         c.DisplayMode,
	}
	for _, dep := range c.CourseDependencies {
		if dep.DependencyType == enums.DependencyTypePrerequisite && dep.RequiredCourseID != nil && *dep.RequiredCourseID == c.ID {
			cd.Postrequisites = append(cd.Postrequisites, dep.CourseID)
		} else if dep.DependencyType == enums.DependencyTypePrerequisite && dep.CourseID == c.ID && dep.RequiredCourseID != nil {
			cd.Prerequisites = append(cd.Prerequisites, *dep.RequiredCourseID)
		} else if dep.DependencyType == enums.DependencyTypeCorequisite && dep.RequiredCourseID != nil {
			cd.Corequisites = append(cd.Corequisites, *dep.RequiredCourseID)
		}
	}
	return cd
}
