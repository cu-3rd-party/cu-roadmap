package schemas

import (
	"errors"

	"github.com/google/uuid"
)

type RoadmapValidationRequest struct {
	PassedCourseIDs []uuid.UUID    `json:"passed_course_ids" binding:"required"`
	Roadmap         []SemesterData `json:"roadmap" binding:"required"`
	MaxLoad         float64        `json:"max_load" default:"12.0"`
}

func (r *RoadmapValidationRequest) Validate() error {
	if r.MaxLoad <= 0 {
		return errors.New("max_load must be greater than zero")
	}

	return nil
}

type ValidationMessage struct {
	Level    string     `json:"level"`
	Message  string     `json:"message"`
	CourseID *uuid.UUID `json:"course_id,omitempty"`
}

type ValidationResult struct {
	IsValid   bool                `json:"is_valid"`
	Messages  []ValidationMessage `json:"messages"`
	TotalLoad float64             `json:"total_load"`
}
