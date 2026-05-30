package schemas

import "github.com/google/uuid"

type PlannerRequest struct {
	PassedCourseIDs []uuid.UUID `json:"passed_course_ids" binding:"required"`
	MajorID         uuid.UUID   `json:"major_id" binding:"required"`
	CurrentSemester int         `json:"current_semester" default:"1"`
	MaxLoad         float64     `json:"max_load" default:"12.0"`
	Cohort          int         `json:"cohort"`
}
