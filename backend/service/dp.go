package service

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

type DPPlanner struct {
	store interfaces.StoreBase
}

func NewDPPlanner(s interfaces.StoreBase) *DPPlanner {
	return &DPPlanner{store: s}
}

func (p *DPPlanner) GenerateRoadmap(
	passedCourseIDs []uuid.UUID,
	majorID uuid.UUID,
	currentSemester int,
	maxLoad float64,
	cohort int,
) (interface{}, error) {
	return generateRoadmapWithStrategy(p.store, passedCourseIDs, majorID, currentSemester, maxLoad, cohort, selectDPSemester)
}
