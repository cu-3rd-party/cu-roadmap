package helpers

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/models"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
)

func ToMajorModel(major interfaces.MajorData) models.Major {
	return models.Major{ID: major.ID, Title: major.Title, School: major.School, CohortYear: major.CohortYear, RequirementsBoxID: major.RequirementsBoxID}
}
