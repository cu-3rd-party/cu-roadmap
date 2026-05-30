package schemas

import "github.com/google/uuid"

type SemesterValidationRequest struct {
	CurrentSemester int         `json:"current_semester" binding:"required"`
	CourseIDs       []uuid.UUID `json:"course_ids" binding:"required"`
	PassedCourseIDs []uuid.UUID `json:"passed_course_ids" binding:"required"`
	MaxLoad         float64     `json:"max_load" default:"12.0"`
}
