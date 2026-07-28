using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Application.Common.Models;

namespace CuRoadmap.Application.Planner;

public class DPPlanner : IRoadmapPlanner
{
    private readonly IApplicationDbContext _context;

    public DPPlanner(IApplicationDbContext context) => _context = context;

    public async Task<object> GenerateRoadmapAsync(
        List<Guid> passedCourseIds, List<PlannedSemester> plannedSemesters,
        Guid majorId, Guid? specializationId, int currentSemester,
        double maxLoad, int cohort, CancellationToken ct = default)
    {
        return await RoadmapPlannerImpl.GenerateRoadmapWithStrategyAsync(
            _context, passedCourseIds, plannedSemesters,
            majorId, specializationId, currentSemester,
            maxLoad, cohort,
            RoadmapPlannerImpl.SelectDPSemester, ct);
    }
}
