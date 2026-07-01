package requirements

import (
	"strings"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/enums"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

type FlatRequirementInput struct {
	ID              uuid.UUID
	CourseID        uuid.UUID
	RequirementType enums.RequirementType
	Specializations []string
}

type MutableStore interface {
	GetMajorByID(majorID uuid.UUID) (*interfaces.MajorData, error)
	GetSpecializationsByMajor(majorID uuid.UUID) ([]interfaces.SpecializationData, error)
	CreateBox(box interfaces.BoxData) (interfaces.BoxData, error)
	GetBoxEdges() ([]interfaces.BoxEdgeData, error)
	CreateBoxEdge(edge interfaces.BoxEdgeData) (interfaces.BoxEdgeData, error)
	DeleteBoxEdgesByParent(parentBoxID uuid.UUID) error
	DeleteBoxEdgesByChild(childBoxID uuid.UUID) error
	DeleteBox(boxID uuid.UUID) error
}

func AddFlatRequirement(store MutableStore, majorID uuid.UUID, req FlatRequirementInput) error {
	major, err := store.GetMajorByID(majorID)
	if err != nil || major == nil {
		return err
	}
	reqType := req.RequirementType
	leaf, err := store.CreateBox(interfaces.BoxData{
		ID:              req.ID,
		Kind:            enums.BoxKindCourse,
		CourseID:        &req.CourseID,
		RequirementType: &reqType,
		Specializations: append([]string(nil), req.Specializations...),
	})
	if err != nil {
		return err
	}
	edges, err := store.GetBoxEdges()
	if err != nil {
		return err
	}
	if major.RequirementsBoxID != nil && (req.RequirementType != enums.RequirementTypeMajorChoice || len(req.Specializations) == 0) {
		position := nextPosition(edges, *major.RequirementsBoxID)
		if _, err := store.CreateBoxEdge(interfaces.BoxEdgeData{ID: uuid.New(), ParentBoxID: *major.RequirementsBoxID, ChildBoxID: leaf.ID, Position: position}); err != nil {
			return err
		}
	}
	if req.RequirementType == enums.RequirementTypeMajorChoice && len(req.Specializations) > 0 {
		specs, err := store.GetSpecializationsByMajor(majorID)
		if err != nil {
			return err
		}
		for _, specTitle := range req.Specializations {
			for _, spec := range specs {
				if spec.RequirementsBoxID == nil || !strings.EqualFold(spec.Title, specTitle) {
					continue
				}
				position := nextPosition(edges, *spec.RequirementsBoxID)
				if _, err := store.CreateBoxEdge(interfaces.BoxEdgeData{ID: uuid.New(), ParentBoxID: *spec.RequirementsBoxID, ChildBoxID: leaf.ID, Position: position}); err != nil {
					return err
				}
			}
		}
	}
	return nil
}

func ReplaceFlatRequirements(store MutableStore, majorID uuid.UUID, reqs []FlatRequirementInput) error {
	major, err := store.GetMajorByID(majorID)
	if err != nil || major == nil {
		return err
	}
	childIDs := make(map[uuid.UUID]struct{})
	if major.RequirementsBoxID != nil {
		edges, err := store.GetBoxEdges()
		if err != nil {
			return err
		}
		for _, edge := range edges {
			if edge.ParentBoxID == *major.RequirementsBoxID {
				childIDs[edge.ChildBoxID] = struct{}{}
			}
		}
		if err := store.DeleteBoxEdgesByParent(*major.RequirementsBoxID); err != nil {
			return err
		}
	}
	specs, err := store.GetSpecializationsByMajor(majorID)
	if err != nil {
		return err
	}
	for _, spec := range specs {
		if spec.RequirementsBoxID == nil {
			continue
		}
		edges, err := store.GetBoxEdges()
		if err != nil {
			return err
		}
		for _, edge := range edges {
			if edge.ParentBoxID == *spec.RequirementsBoxID {
				childIDs[edge.ChildBoxID] = struct{}{}
			}
		}
		if err := store.DeleteBoxEdgesByParent(*spec.RequirementsBoxID); err != nil {
			return err
		}
	}
	for childID := range childIDs {
		if err := store.DeleteBoxEdgesByChild(childID); err != nil {
			return err
		}
		if err := store.DeleteBox(childID); err != nil {
			return err
		}
	}
	for _, req := range reqs {
		if err := AddFlatRequirement(store, majorID, req); err != nil {
			return err
		}
	}
	return nil
}

func nextPosition(edges []interfaces.BoxEdgeData, parentID uuid.UUID) int {
	position := 0
	for _, edge := range edges {
		if edge.ParentBoxID == parentID && edge.Position >= position {
			position = edge.Position + 1
		}
	}
	return position
}
