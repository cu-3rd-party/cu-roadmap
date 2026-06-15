package schemas

import (
	"errors"

	"github.com/google/uuid"
)

type RoadmapValidationRequest struct {
	Roadmap         []SemesterData `json:"roadmap" binding:"required"`
	MaxLoad         float64        `json:"max_load" default:"30.0"`
	CurrentSemester int            `json:"current_semester"`
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
