package schemas

import "github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"

type CreateCourseRequest struct {
	Title               string               `json:"title" binding:"required"`
	Description         *string              `json:"description"`
	HandbookLink        *string              `json:"handbook_link"`
	CourseType          enums.CourseType     `json:"course_type"`
	Category            enums.CourseCategory `json:"category"`
	AllowedCohorts      []int                `json:"allowed_cohorts"`
	AvailableSemesters  []int                `json:"available_semesters"`
	RecommendedSemester *int                 `json:"recommended_semester"`
	Workload            float64              `json:"workload"`
	Prerequisites       []string             `json:"prerequisites"`
	Corequisites        []string             `json:"corequisites"`
}

type UpdateCourseRequest struct {
	Title               string               `json:"title" binding:"required"`
	Description         *string              `json:"description"`
	HandbookLink        *string              `json:"handbook_link"`
	CourseType          enums.CourseType     `json:"course_type"`
	Category            enums.CourseCategory `json:"category"`
	AllowedCohorts      []int                `json:"allowed_cohorts"`
	AvailableSemesters  []int                `json:"available_semesters"`
	RecommendedSemester *int                 `json:"recommended_semester"`
	Workload            float64              `json:"workload"`
	Prerequisites       []string             `json:"prerequisites"`
	Corequisites        []string             `json:"corequisites"`
}
