using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Domain.Enums;

namespace CuRoadmap.Application.Planner;

public static class RoadmapPlannerFactory
{
    public static IRoadmapPlanner Create(PlannerKind kind, IApplicationDbContext context)
    {
        return kind switch
        {
            PlannerKind.Greedy => new GreedyPlanner(context),
            PlannerKind.DynamicProgramming => new DPPlanner(context),
            PlannerKind.IntegerLinearProgram => new ILPPlanner(context),
            PlannerKind.LinearRelaxation => new LPRelaxationPlanner(context),
            _ => new GreedyPlanner(context)
        };
    }
}
