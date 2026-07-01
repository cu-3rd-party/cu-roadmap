package interfaces

import "github.com/google/uuid"

type MajorData struct {
	ID                uuid.UUID
	Title             string
	School            string
	CohortYear        int
	RequirementsBoxID *uuid.UUID
}
