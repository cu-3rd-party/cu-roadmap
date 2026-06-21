package service

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/schemas"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

type LPRelaxationPlanner struct {
	store interfaces.StoreBase
}

func NewLPRelaxationPlanner(s interfaces.StoreBase) *LPRelaxationPlanner {
	return &LPRelaxationPlanner{store: s}
}

func (p *LPRelaxationPlanner) GenerateRoadmap(
	passedCourseIDs []uuid.UUID,
	plannedSemesters []schemas.PlannedSemester,
	majorID uuid.UUID,
	specializationID *uuid.UUID,
	currentSemester int,
	maxLoad float64,
	cohort int,
) (interface{}, error) {
	return generateRoadmapWithStrategy(p.store, passedCourseIDs, plannedSemesters, majorID, specializationID, currentSemester, maxLoad, cohort, selectLPRelaxationSemester)
}
