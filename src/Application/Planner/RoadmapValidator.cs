using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Application.Common.Models;
using CuRoadmap.Application.Requirements;

namespace CuRoadmap.Application.Planner;

public class RoadmapValidator
{
    private readonly IApplicationDbContext _context;
    private Dictionary<Guid, CourseData> _allCourses = new();
    private Dictionary<Guid, List<CourseDependencyData>> _depsByCourse = new();

    public RoadmapValidator(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task LoadDataAsync(CancellationToken ct = default)
    {
        _allCourses = await _context.GetAllCoursesAsync(ct);
        var deps = await _context.GetCourseDependenciesAsync(ct);
        _depsByCourse = deps.GroupBy(d => d.CourseId)
            .ToDictionary(g => g.Key, g => g.ToList());
    }

    public async Task<ValidationResult> ValidateSemesterAsync(
        List<Guid> courseIds,
        HashSet<Guid> previouslyPassedIds,
        int currentSemNum,
        double maxLoad,
        CancellationToken ct = default)
    {
        var coursesInSem = courseIds
            .Select(id => _allCourses.TryGetValue(id, out var c) ? c : null)
            .Where(c => c is not null)
            .Cast<CourseData>()
            .ToList();

        var messages = new List<ValidationMessage>();
        var totalLoad = coursesInSem.Sum(c => c.Workload);
        var inSemIds = coursesInSem.Select(c => c.Id).ToHashSet();

        if (totalLoad > maxLoad)
        {
            messages.Add(new ValidationMessage("warning",
                $"Превышена нагрузка ({totalLoad:F1} > {maxLoad:F1})", null));
        }

        foreach (var c in coursesInSem)
        {
            if (c.AvailableSemesters.Length > 0 && !c.AvailableSemesters.Contains(currentSemNum))
            {
                messages.Add(new ValidationMessage("error",
                    $"Курс '{c.Title}' не читается в {currentSemNum}-м семестре", c.Id));
            }
        }

        foreach (var course in _allCourses.Values)
        {
            if (!RoadmapPlannerImpl.ShouldAutoForceExclusiveSemester(course, _allCourses)) continue;
            if (course.AvailableSemesters is not [var forcedSem]) continue;
            if (forcedSem != currentSemNum) continue;
            if (inSemIds.Contains(course.Id) || previouslyPassedIds.Contains(course.Id)) continue;

            messages.Add(new ValidationMessage("error",
                $"Курс '{course.Title}' является обязательным к прохождению в {currentSemNum}-м семестре",
                course.Id));
        }

        var hasStem = coursesInSem.Any(c => c.Category == Domain.Enums.CourseCategory.Stem);
        var hasSoft = coursesInSem.Any(c => c.Category == Domain.Enums.CourseCategory.Soft);
        var hasScienceStudio = false;
        var hasBusinessStudio = false;

        foreach (var id in previouslyPassedIds)
        {
            if (_allCourses.TryGetValue(id, out var rc))
            {
                var lowerGroup = rc.AnalogGroup.ToLowerInvariant();
                if (lowerGroup.Contains("научн")) hasScienceStudio = true;
                if (lowerGroup.Contains("бизнес")) hasBusinessStudio = true;
            }
        }

        foreach (var c in coursesInSem)
        {
            var lowerGroup = c.AnalogGroup.ToLowerInvariant();
            if (lowerGroup.Contains("научн")) hasScienceStudio = true;
            if (lowerGroup.Contains("бизнес")) hasBusinessStudio = true;
        }

        if (!hasStem && coursesInSem.Count > 0)
        {
            messages.Add(new ValidationMessage("error",
                "Необходимо выбрать хотя бы один STEM-курс каждый семестр", null));
        }

        if (!hasSoft && currentSemNum > 1 && coursesInSem.Count > 0)
        {
            messages.Add(new ValidationMessage("error",
                "Необходимо выбрать хотя бы один Soft-курс каждый семестр, начиная со второго", null));
        }

        if (currentSemNum >= 4)
        {
            if (!hasScienceStudio)
            {
                messages.Add(new ValidationMessage("error",
                    "За первые 4 семестра необходимо пройти хотя бы одну научную студию", null));
            }
            if (!hasBusinessStudio)
            {
                messages.Add(new ValidationMessage("error",
                    "За первые 4 семестра необходимо пройти хотя бы одну бизнес-студию", null));
            }
        }

        foreach (var c in coursesInSem)
        {
            var prereqGroups = new Dictionary<int, List<CourseDependencyData>>();
            var coreqDeps = new List<CourseDependencyData>();

            if (_depsByCourse.TryGetValue(c.Id, out var deps))
            {
                foreach (var dep in deps)
                {
                    if (dep.DependencyType == Domain.Enums.DependencyType.Prerequisite)
                    {
                        if (!prereqGroups.ContainsKey(dep.AlternativeGroup))
                            prereqGroups[dep.AlternativeGroup] = new List<CourseDependencyData>();
                        prereqGroups[dep.AlternativeGroup].Add(dep);
                    }
                    else if (dep.DependencyType == Domain.Enums.DependencyType.Corequisite)
                    {
                        coreqDeps.Add(dep);
                    }
                }
            }

            foreach (var (groupNum, groupDeps) in prereqGroups)
            {
                if (groupNum == 0)
                {
                    foreach (var dep in groupDeps)
                    {
                        var reqTitle = _allCourses.TryGetValue(dep.RequiredCourseId, out var rc)
                            ? rc.Title : "Неизвестный курс";
                        if (!IsCoursePassedOrPlanned(dep.RequiredCourseId, null, previouslyPassedIds, false, true))
                        {
                            messages.Add(new ValidationMessage("error",
                                $"Для '{c.Title}' нужен пререквизит: {reqTitle}", c.Id));
                        }
                    }
                }
                else
                {
                    var anyPassed = false;
                    var altTitles = new List<string>();
                    foreach (var dep in groupDeps)
                    {
                        var reqTitle = _allCourses.TryGetValue(dep.RequiredCourseId, out var rc)
                            ? rc.Title : "Неизвестный курс";
                        altTitles.Add(reqTitle);
                        if (IsCoursePassedOrPlanned(dep.RequiredCourseId, null, previouslyPassedIds, false, true))
                            anyPassed = true;
                    }
                    if (!anyPassed)
                    {
                        messages.Add(new ValidationMessage("error",
                            $"Для '{c.Title}' нужен один из пререквизитов: {string.Join(" / ", altTitles)}", c.Id));
                    }
                }
            }

            foreach (var dep in coreqDeps)
            {
                var reqTitle = _allCourses.TryGetValue(dep.RequiredCourseId, out var rc)
                    ? rc.Title : "Неизвестный курс";

                var satisfied = IsCoursePassedOrPlanned(dep.RequiredCourseId, inSemIds, null, true, false);
                if (!satisfied && HasEquivalentPrerequisite(dep.CourseId, dep.RequiredCourseId))
                {
                    satisfied = IsCoursePassedOrPlanned(dep.RequiredCourseId, null, previouslyPassedIds, false, true);
                }

                if (!satisfied)
                {
                    messages.Add(new ValidationMessage("error",
                        $"'{c.Title}' и '{reqTitle}' должны изучаться одновременно", c.Id));
                }
            }
        }

        var isValid = messages.All(m => m.Level != "error");
        return new ValidationResult(isValid, messages, totalLoad);
    }

    public async Task<List<Dictionary<string, object>>> ValidateFullRoadmapAsync(
        List<SemesterData> roadmapData,
        HashSet<Guid> initialPassedIds,
        double maxLoad,
        HashSet<Guid> requiredCourseIds,
        CancellationToken ct = default)
    {
        var results = new List<Dictionary<string, object>>();
        var currentPassed = new HashSet<Guid>(initialPassedIds);

        foreach (var sem in roadmapData)
        {
            var semCourses = sem.CourseIds
                .Select(id => _allCourses.TryGetValue(id, out var c) ? c : null)
                .Where(c => c is not null)
                .Cast<CourseData>()
                .ToList();

            var semCourseIds = semCourses.Select(c => c.Id).ToList();
            var res = await ValidateSemesterAsync(semCourseIds, currentPassed, sem.Semester, maxLoad, ct);

            var msgs = res.Messages.Select(m => new Dictionary<string, object>
            {
                ["level"] = m.Level,
                ["message"] = m.Message,
                ["course_id"] = m.CourseId?.ToString()
            }).ToList();

            results.Add(new Dictionary<string, object>
            {
                ["semester"] = sem.Semester,
                ["valid"] = res.IsValid,
                ["total_load"] = res.TotalLoad,
                ["messages"] = msgs
            });

            foreach (var c in semCourses)
                currentPassed.Add(c.Id);
        }

        if (results.Count > 0 && requiredCourseIds.Count > 0)
        {
            var lastSem = results[^1];
            var msgs = (List<Dictionary<string, object>>)lastSem["messages"];
            var isValid = (bool)lastSem["valid"];

            foreach (var reqId in requiredCourseIds)
            {
                if (!currentPassed.Contains(reqId))
                {
                    isValid = false;
                    var reqTitle = _allCourses.TryGetValue(reqId, out var rc)
                        ? rc.Title : "Неизвестный курс";
                    msgs.Add(new Dictionary<string, object>
                    {
                        ["level"] = "error",
                        ["message"] = $"На ваш мейджор это обязательный курс: {reqTitle}",
                        ["course_id"] = reqId.ToString()
                    });
                }
            }

            lastSem["valid"] = isValid;
        }

        return results;
    }

    private bool HasEquivalentPrerequisite(Guid courseId, Guid requiredCourseId)
    {
        if (!_depsByCourse.TryGetValue(courseId, out var deps)) return false;
        return deps.Any(d => d.DependencyType == Domain.Enums.DependencyType.Prerequisite
                             && d.RequiredCourseId == requiredCourseId);
    }

    private bool IsCoursePassedOrPlanned(
        Guid requiredCourseId,
        HashSet<Guid>? inSemIds,
        HashSet<Guid>? previouslyPassedIds,
        bool checkInSem,
        bool checkPassed)
    {
        if (checkInSem && inSemIds is not null && inSemIds.Contains(requiredCourseId))
            return true;
        if (checkPassed && previouslyPassedIds is not null && previouslyPassedIds.Contains(requiredCourseId))
            return true;

        if (!_allCourses.TryGetValue(requiredCourseId, out var reqCourse) || string.IsNullOrEmpty(reqCourse.AnalogGroup))
            return false;

        if (checkInSem && inSemIds is not null)
        {
            if (inSemIds.Any(id => _allCourses.TryGetValue(id, out var pc)
                                   && RequirementResolver.AnalogGroupsIntersect(pc.AnalogGroup, reqCourse.AnalogGroup)))
                return true;
        }
        if (checkPassed && previouslyPassedIds is not null)
        {
            if (previouslyPassedIds.Any(id => _allCourses.TryGetValue(id, out var pc)
                                              && RequirementResolver.AnalogGroupsIntersect(pc.AnalogGroup, reqCourse.AnalogGroup)))
                return true;
        }

        return false;
    }
}
