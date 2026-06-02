package interfaces

import "github.com/google/uuid"

type StudentData struct {
	ID              uuid.UUID
	Cohort          int
	CurrentSemester int
	TargetMajorID   *uuid.UUID
	PassedCourseIDs []uuid.UUID
}
