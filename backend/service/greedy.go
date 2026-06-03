package service

import (
	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

type GreedyPlanner struct {
	store interfaces.StoreBase
}

func NewGreedyPlanner(s interfaces.StoreBase) *GreedyPlanner {
	return &GreedyPlanner{store: s}
}

func (p *GreedyPlanner) GenerateRoadmap(
	passedCourseIDs []uuid.UUID,
	majorID uuid.UUID,
	currentSemester int,
	maxLoad float64,
	cohort int,
) (interface{}, error) {
	return generateRoadmapWithStrategy(p.store, passedCourseIDs, majorID, currentSemester, maxLoad, cohort, selectGreedySemester)
}

func cohortInSlice(cohort int, cohorts []int) bool {
	for _, c := range cohorts {
		if c == cohort {
			return true
		}
	}
	return false
}
