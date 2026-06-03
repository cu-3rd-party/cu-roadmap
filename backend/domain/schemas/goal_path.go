package schemas

import (
	"errors"

	"github.com/google/uuid"
)

type GoalPathRequest struct {
	TargetCourseID  uuid.UUID   `json:"target_course_id" binding:"required"`
	PassedCourseIDs []uuid.UUID `json:"passed_course_ids" binding:"required"`
	CurrentSemester int         `json:"current_semester" default:"1"`
	MaxLoad         float64     `json:"max_load" default:"12.0"`
}

func (g *GoalPathRequest) Validate() error {
	if g.CurrentSemester <= 0 {
		return errors.New("current_semester must be greater than zero")
	}
	if g.MaxLoad <= 0 {
		return errors.New("max_load must be greater than zero")
	}

	return nil
}
