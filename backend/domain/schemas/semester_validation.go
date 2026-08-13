package schemas

import (
	"errors"

	"github.com/google/uuid"
)

type SemesterValidationRequest struct {
	CurrentSemester  int          `json:"current_semester" binding:"required"`
	CourseIDs        []uuid.UUID  `json:"course_ids" binding:"required"`
	PassedCourseIDs  []uuid.UUID  `json:"passed_course_ids" binding:"required"`
	MaxLoad          float64      `json:"max_load" default:"60.0"`
	SpecializationID *uuid.UUID   `json:"specialization_id"`
}

func (s *SemesterValidationRequest) Validate() error {
	if s.CurrentSemester < 0 {
		return errors.New("current_semester must be greater than zero")
	}
	if s.MaxLoad <= 0 {
		return errors.New("max_load must be greater than zero")
	}

	return nil
}
