package service

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/domain/schemas"
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

type ILPPlanner struct {
	store interfaces.StoreBase
}

func NewILPPlanner(s interfaces.StoreBase) *ILPPlanner {
	return &ILPPlanner{store: s}
}

func (p *ILPPlanner) GenerateRoadmap(
	passedCourseIDs []uuid.UUID,
	plannedSemesters []schemas.PlannedSemester,
	majorID uuid.UUID,
	currentSemester int,
	maxLoad float64,
	cohort int,
) (interface{}, error) {
	return generateRoadmapWithStrategy(p.store, passedCourseIDs, plannedSemesters, majorID, currentSemester, maxLoad, cohort, selectILPSemester)
}
