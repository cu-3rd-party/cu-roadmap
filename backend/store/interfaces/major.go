package interfaces

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/google/uuid"
)

type MajorData struct {
	ID         uuid.UUID
	Title      string
	School     string
	CohortYear int
}

type MajorRequirementData struct {
	ID              uuid.UUID
	MajorID         uuid.UUID
	CourseID        uuid.UUID
	RequirementType enums.RequirementType
}
