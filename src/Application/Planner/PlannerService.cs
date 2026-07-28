using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Application.Common.Models;

namespace CuRoadmap.Application.Planner;

public class PlannerService
{
    private readonly IApplicationDbContext _context;
    private Dictionary<Guid, List<CourseDependencyData>> _depsByCourse = new();

    public PlannerService(IApplicationDbContext context)
    {
        _context = context;
    }

    private async Task LoadDependenciesAsync(CancellationToken ct = default)
    {
        var deps = await _context.GetCourseDependenciesAsync(ct);
        _depsByCourse = deps.GroupBy(d => d.CourseId)
            .ToDictionary(g => g.Key, g => g.ToList());
    }

    public async Task<List<Dictionary<string, object>>> FindPathToCourseAsync(
        Guid targetCourseId,
        HashSet<Guid> passedIds,
        int currentSemester,
        double maxLoad,
        int? goalSemester,
        CancellationToken ct = default)
    {
        await LoadDependenciesAsync(ct);
        var allCourses = await _context.GetAllCoursesAsync(ct);

        if (!allCourses.TryGetValue(targetCourseId, out var target))
        {
            return [new Dictionary<string, object> { ["error"] = "Target course not found" }];
        }

        var neededIds = new HashSet<Guid>();
        var toCheck = new Stack<Guid>();
        toCheck.Push(targetCourseId);

        while (toCheck.Count > 0)
        {
            var currId = toCheck.Pop();
            if (passedIds.Contains(currId) || neededIds.Contains(currId)) continue;

            neededIds.Add(currId);

            if (!_depsByCourse.TryGetValue(currId, out var deps)) continue;

            var groups = new Dictionary<int, List<Guid>>();
            foreach (var dep in deps.Where(d => d.DependencyType == Domain.Enums.DependencyType.Prerequisite))
            {
                if (!groups.ContainsKey(dep.AlternativeGroup))
                    groups[dep.AlternativeGroup] = new List<Guid>();
                groups[dep.AlternativeGroup].Add(dep.RequiredCourseId);
            }

            foreach (var (groupNum, altIds) in groups)
            {
                if (groupNum == 0)
                {
                    foreach (var reqId in altIds) toCheck.Push(reqId);
                }
                else
                {
                    var picked = altIds.FirstOrDefault(passedIds.Contains);
                    if (picked == Guid.Empty)
                        picked = altIds.FirstOrDefault(neededIds.Contains);
                    if (picked == Guid.Empty && altIds.Count > 0)
                        picked = altIds[0];
                    if (picked != Guid.Empty) toCheck.Push(picked);
                }
            }
        }

        var coursesTodo = neededIds
            .Where(id => allCourses.ContainsKey(id))
            .ToDictionary(id => id, id => allCourses[id]);

        var currentPassed = new HashSet<Guid>(passedIds);
        var roadmap = new List<Dictionary<string, object>>();
        var currentSem = currentSemester;

        while (coursesTodo.Count > 0)
        {
            var available = coursesTodo
                .Where(kvp => PrereqsSatisfiedByDeps(kvp.Key, currentPassed))
                .Select(kvp => kvp.Value)
                .ToList();

            if (available.Count == 0)
            {
                roadmap.Add(new Dictionary<string, object>
                {
                    ["semester"] = currentSem,
                    ["error"] = "Cannot satisfy dependencies for remaining courses."
                });
                break;
            }

            var isOdd = currentSem % 2 != 0;
            var availableOffered = available
                .Where(c => !(goalSemester.HasValue && c.Id == targetCourseId && currentSem < goalSemester.Value))
                .Where(c => c.AvailableSemesters.Length == 0
                            || (c.AvailableSemesters.All(s => s % 2 != 0) == isOdd)
                            || c.AvailableSemesters.Contains(currentSem)
                            || c.AvailableSemesters.Any(s =>
                            {
                                var cOdd = s % 2 != 0;
                                return cOdd == isOdd;
                            }))
                .ToList();

            if (availableOffered.Count == 0)
            {
                roadmap.Add(new Dictionary<string, object>
                {
                    ["semester"] = currentSem,
                    ["course_ids"] = new List<string>(),
                    ["status"] = "Waiting for correct semester offering"
                });
            }
            else
            {
                var semCourses = new List<CourseData>();
                var semLoad = 0.0;
                foreach (var c in availableOffered)
                {
                    if (semLoad + c.Workload <= maxLoad)
                    {
                        semCourses.Add(c);
                        semLoad += c.Workload;
                    }
                }

                var semCoursesOut = new List<string>();
                foreach (var c in semCourses)
                {
                    currentPassed.Add(c.Id);
                    coursesTodo.Remove(c.Id);
                    semCoursesOut.Add(c.Id.ToString());
                }

                roadmap.Add(new Dictionary<string, object>
                {
                    ["semester"] = currentSem,
                    ["course_ids"] = semCoursesOut,
                    ["total_load"] = semLoad
                });
            }

            currentSem++;
            if (currentSem > 20) break;
        }

        return roadmap;
    }

    private bool PrereqsSatisfiedByDeps(Guid courseId, HashSet<Guid> passedIds)
    {
        if (!_depsByCourse.TryGetValue(courseId, out var deps)) return true;

        var groups = new Dictionary<int, List<Guid>>();
        foreach (var dep in deps.Where(d => d.DependencyType == Domain.Enums.DependencyType.Prerequisite))
        {
            if (!groups.ContainsKey(dep.AlternativeGroup))
                groups[dep.AlternativeGroup] = new List<Guid>();
            groups[dep.AlternativeGroup].Add(dep.RequiredCourseId);
        }

        foreach (var (groupNum, altIds) in groups)
        {
            if (groupNum == 0)
            {
                if (altIds.Any(reqId => !passedIds.Contains(reqId))) return false;
            }
            else
            {
                if (altIds.All(reqId => !passedIds.Contains(reqId))) return false;
            }
        }

        return true;
    }
}
