package helpers

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
)

func ToSpecializationModel(spec interfaces.SpecializationData) models.Specialization {
	return models.Specialization{ID: spec.ID, MajorID: spec.MajorID, Title: spec.Title}
}
