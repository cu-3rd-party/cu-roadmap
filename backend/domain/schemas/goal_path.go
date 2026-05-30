package schemas

import "github.com/google/uuid"

type GoalPathRequest struct {
	TargetCourseID  uuid.UUID   `json:"target_course_id" binding:"required"`
	PassedCourseIDs []uuid.UUID `json:"passed_course_ids" binding:"required"`
	CurrentSemester int         `json:"current_semester" default:"1"`
	MaxLoad         float64     `json:"max_load" default:"12.0"`
}
