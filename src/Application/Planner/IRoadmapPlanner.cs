using CuRoadmap.Application.Common.Models;

namespace CuRoadmap.Application.Planner;

public interface IRoadmapPlanner
{
    Task<object> GenerateRoadmapAsync(
        List<Guid> passedCourseIds,
        List<PlannedSemester> plannedSemesters,
        Guid majorId,
        Guid? specializationId,
        int currentSemester,
        double maxLoad,
        int cohort,
        CancellationToken ct = default);
}
