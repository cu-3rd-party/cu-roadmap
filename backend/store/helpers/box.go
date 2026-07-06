package helpers

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/lib/pq"
)

func ToBoxModel(box interfaces.BoxData) models.Box {
	return models.Box{
		ID:                       box.ID,
		Kind:                     box.Kind,
		Title:                    box.Title,
		CourseID:                 box.CourseID,
		LogicalOp:                box.LogicalOp,
		RequiredCount:            box.RequiredCount,
		RequirementType:          box.RequirementType,
		Specializations:          pq.StringArray(box.Specializations),
		MandatorySpecializations: pq.StringArray(box.MandatorySpecializations),
		AdmissionYear:            box.AdmissionYear,
		MajorTrack:               box.MajorTrack,
	}
}

func ToBoxData(box *models.Box) interfaces.BoxData {
	return interfaces.BoxData{
		ID:                       box.ID,
		Kind:                     box.Kind,
		Title:                    box.Title,
		CourseID:                 box.CourseID,
		LogicalOp:                box.LogicalOp,
		RequiredCount:            box.RequiredCount,
		RequirementType:          box.RequirementType,
		Specializations:          []string(box.Specializations),
		MandatorySpecializations: []string(box.MandatorySpecializations),
		AdmissionYear:            box.AdmissionYear,
		MajorTrack:               box.MajorTrack,
	}
}
