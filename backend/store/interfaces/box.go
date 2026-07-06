package interfaces

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/google/uuid"
)

type BoxData struct {
	ID                       uuid.UUID
	Kind                     enums.BoxKind
	Title                    string
	CourseID                 *uuid.UUID
	LogicalOp                *enums.LogicalOp
	RequiredCount            int
	RequirementType          *enums.RequirementType
	Specializations          []string
	MandatorySpecializations []string
	AdmissionYear            *int
	MajorTrack               *string
}

type BoxEdgeData struct {
	ID          uuid.UUID
	ParentBoxID uuid.UUID
	ChildBoxID  uuid.UUID
	Position    int
}
