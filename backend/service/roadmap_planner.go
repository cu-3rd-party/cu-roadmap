package service

import (
	"fmt"

	"github.com/cu-3rd-party/cu-roadmap/backend/domain/schemas"
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
	// GenerateRoadmap creates a course roadmap for a given major.
	// passedCourseIDs are the courses the student has already passed.
	// plannedSemesters are specific courses pinned by the user to future semesters.
	// majorID is the UUID of the major the student wants to pursue.
	// currentSemester is the starting semester for the roadmap generation.
	// maxLoad is the maximum workload (credits) allowed per semester.
	// cohort is the student's admission year.
	GenerateRoadmap(
		passedCourseIDs []uuid.UUID,
		plannedSemesters []schemas.PlannedSemester,
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
