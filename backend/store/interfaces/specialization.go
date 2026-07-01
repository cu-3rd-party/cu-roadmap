package interfaces

import "github.com/google/uuid"

type SpecializationData struct {
	ID                uuid.UUID  `json:"id"`
	MajorID           uuid.UUID  `json:"major_id"`
	Title             string     `json:"title"`
	RequirementsBoxID *uuid.UUID `json:"-"`
}
