package interfaces

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/google/uuid"
)

type SpecializationData struct {
	ID                uuid.UUID         `json:"id"`
	MajorID           uuid.UUID         `json:"major_id"`
	Title             string            `json:"title"`
	RequirementsBoxID *uuid.UUID        `json:"-"`
	CourseRestrictions []CourseRestrictionData `json:"course_restrictions,omitempty"`
}

type CourseRestrictionData struct {
	ID                uuid.UUID            `json:"id"`
	SpecializationID  uuid.UUID            `json:"specialization_id"`
	Semester          int                  `json:"semester"`
	Category          enums.CourseCategory `json:"category"`
	MinCourses        int                  `json:"min_courses"`
	MaxCourses        int                  `json:"max_courses"`
	InternalDescription string             `json:"internal_description,omitempty"`
}
