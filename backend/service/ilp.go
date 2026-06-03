package service

import (
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
	majorID uuid.UUID,
	currentSemester int,
	maxLoad float64,
	cohort int,
) (interface{}, error) {
	return generateRoadmapWithStrategy(p.store, passedCourseIDs, majorID, currentSemester, maxLoad, cohort, selectILPSemester)
}
