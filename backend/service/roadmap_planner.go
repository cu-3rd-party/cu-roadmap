package service

import (
	"fmt"

	"github.com/cu-3rd-party/cu-roadmap/backend/store/interfaces"
	"github.com/google/uuid"
)

type PlannerKind string

const (
	PlannerKindGreedy               PlannerKind = "greedy"
	PlannerKindDynamicProgramming   PlannerKind = "dp"
	PlannerKindIntegerLinearProgram PlannerKind = "ilp"
	PlannerKindLinearRelaxation     PlannerKind = "lp_relaxation"
)

type RoadmapPlanner interface {
	GenerateRoadmap(
		passedCourseIDs []uuid.UUID,
		majorID uuid.UUID,
		currentSemester int,
		maxLoad float64,
		cohort int,
	) (interface{}, error)
}

func NewRoadmapPlanner(kind PlannerKind, s interfaces.StoreBase) (RoadmapPlanner, error) {
	switch kind {
	case "", PlannerKindGreedy:
		return NewGreedyPlanner(s), nil
	case PlannerKindDynamicProgramming:
		return NewDPPlanner(s), nil
	case PlannerKindIntegerLinearProgram:
		return NewILPPlanner(s), nil
	case PlannerKindLinearRelaxation:
		return NewLPRelaxationPlanner(s), nil
	default:
		return nil, fmt.Errorf("unsupported planner kind: %s", kind)
	}
}
