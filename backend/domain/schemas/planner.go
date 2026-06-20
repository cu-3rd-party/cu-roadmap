package schemas

import (
	"errors"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/google/uuid"
)

type PlannedSemester struct {
	Semester  int         `json:"semester"`
	CourseIDs []uuid.UUID `json:"course_ids"`
}

type PlannerRequest struct {
	PassedCourseIDs   []uuid.UUID        `json:"passed_course_ids" binding:"required"`
	SelectedCourseIDs []PlannedSemester  `json:"selected_course_ids"`
	CourseSource      enums.CourseSource `json:"course_source"`
	MajorID           uuid.UUID          `json:"major_id" binding:"required"`
	CurrentSemester   int                `json:"current_semester" default:"1"`
	MaxLoad           float64            `json:"max_load" default:"60.0"`
	Cohort            int                `json:"cohort"`
}

func (p *PlannerRequest) Validate() error {
	if p.CurrentSemester <= 0 {
		return errors.New("current_semester must be greater than zero")
	}
	if p.MaxLoad <= 0 {
		return errors.New("max_load must be greater than zero")
	}
	if p.Cohort < 0 {
		return errors.New("cohort must be non-negative")
	}

	return nil
}
