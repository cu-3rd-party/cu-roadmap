using CuRoadmap.Application.Common.Models;

namespace CuRoadmap.Application.Requirements;

public class DependencyAnalyzer
{
    private readonly Dictionary<Guid, CourseData> _coursesById;
    private readonly Dictionary<Guid, Dictionary<int, List<Guid>>> _prereqGroups;
    private readonly Dictionary<Guid, List<Guid>> _coreqMap;
    private readonly HashSet<Guid> _passedIds;
    private readonly int _cohortYear;
    private readonly int _currentSemester;
    private readonly bool _resetWhenEmpty;
    private readonly Dictionary<Guid, int> _earliestMemo = new();

    public DependencyAnalyzer(
        Dictionary<Guid, CourseData> coursesById,
        List<CourseDependencyData> deps,
        HashSet<Guid> passedIds,
        int cohortYear,
        int currentSemester,
        bool resetWhenEmpty)
    {
        _coursesById = coursesById;
        _passedIds = passedIds;
        _cohortYear = cohortYear;
        _currentSemester = currentSemester;
        _resetWhenEmpty = resetWhenEmpty;
        _prereqGroups = new Dictionary<Guid, Dictionary<int, List<Guid>>>();
        _coreqMap = new Dictionary<Guid, List<Guid>>();

        foreach (var d in deps)
        {
            if (d.DependencyType == Domain.Enums.DependencyType.Prerequisite)
            {
                if (!_prereqGroups.ContainsKey(d.CourseId))
                    _prereqGroups[d.CourseId] = new Dictionary<int, List<Guid>>();
                if (!_prereqGroups[d.CourseId].ContainsKey(d.AlternativeGroup))
                    _prereqGroups[d.CourseId][d.AlternativeGroup] = new List<Guid>();
                _prereqGroups[d.CourseId][d.AlternativeGroup].Add(d.RequiredCourseId);
            }
            else if (d.DependencyType == Domain.Enums.DependencyType.Corequisite)
            {
                if (!_coreqMap.ContainsKey(d.CourseId))
                    _coreqMap[d.CourseId] = new List<Guid>();
                _coreqMap[d.CourseId].Add(d.RequiredCourseId);
            }
        }
    }

    public int EarliestCompletionSemester(Guid id)
    {
        return EarliestCompletionSemesterInternal(id, new HashSet<Guid>());
    }

    public bool CourseCovered(Guid id)
    {
        if (_passedIds.Contains(id)) return true;
        if (!_coursesById.TryGetValue(id, out var target)) return false;

        var group = target.AnalogGroup.Trim();
        if (string.IsNullOrEmpty(group)) return false;

        return _passedIds.Any(pid =>
            _coursesById.TryGetValue(pid, out var passed) &&
            string.Equals(passed.AnalogGroup.Trim(), group, StringComparison.OrdinalIgnoreCase));
    }

    public bool CourseCanCover(Guid id) => EarliestCompletionSemester(id) <= 8;

    public (List<string> Covered, List<string> CanCover, List<string> CannotCover) CategorizeCourseIds(HashSet<Guid> courseIds)
    {
        var ids = courseIds.OrderBy(x => x.ToString()).ToList();
        var covered = new List<string>();
        var canCover = new List<string>();
        var cannotCover = new List<string>();

        foreach (var id in ids)
        {
            var idStr = id.ToString();
            if (CourseCovered(id))
                covered.Add(idStr);
            else if (CourseCanCover(id))
                canCover.Add(idStr);
            else
                cannotCover.Add(idStr);
        }

        return (covered, canCover, cannotCover);
    }

    private int EarliestCompletionSemesterInternal(Guid id, HashSet<Guid> visited)
    {
        if (CourseCovered(id)) return 0;
        if (_earliestMemo.TryGetValue(id, out var memo)) return memo;
        if (visited.Contains(id)) return int.MaxValue;
        if (!_coursesById.TryGetValue(id, out var course)) return int.MaxValue;

        if (_cohortYear != 0 && course.AllowedCohorts.Length > 0 && !course.AllowedCohorts.Contains(_cohortYear))
            return int.MaxValue;

        visited.Add(id);
        var readySemester = _resetWhenEmpty
            ? (_passedIds.Count > 0 && _currentSemester > 1 ? _currentSemester : 1)
            : _currentSemester;

        if (_prereqGroups.TryGetValue(id, out var groups))
        {
            foreach (var (groupNum, altIds) in groups)
            {
                if (groupNum == 0)
                {
                    foreach (var pid in altIds)
                    {
                        var prereqSem = EarliestCompletionSemesterInternal(pid, visited);
                        if (prereqSem == int.MaxValue)
                        {
                            visited.Remove(id);
                            return int.MaxValue;
                        }
                        if (prereqSem + 1 > readySemester)
                            readySemester = prereqSem + 1;
                    }
                }
                else
                {
                    var minGroupReady = int.MaxValue;
                    foreach (var pid in altIds)
                    {
                        var prereqSem = EarliestCompletionSemesterInternal(pid, visited);
                        if (prereqSem != int.MaxValue && prereqSem + 1 < minGroupReady)
                            minGroupReady = prereqSem + 1;
                    }
                    if (minGroupReady == int.MaxValue)
                    {
                        visited.Remove(id);
                        return int.MaxValue;
                    }
                    if (minGroupReady > readySemester)
                        readySemester = minGroupReady;
                }
            }
        }

        if (_coreqMap.TryGetValue(id, out var coreqs))
        {
            foreach (var pid in coreqs)
            {
                var coreqSem = EarliestCompletionSemesterInternal(pid, visited);
                if (coreqSem == int.MaxValue)
                {
                    visited.Remove(id);
                    return int.MaxValue;
                }
                if (coreqSem > readySemester)
                    readySemester = coreqSem;
            }
        }

        visited.Remove(id);

        for (var sem = readySemester; sem <= 8; sem++)
        {
            if (OfferedInSemester(course, sem))
            {
                _earliestMemo[id] = sem;
                return sem;
            }
        }

        return int.MaxValue;
    }

    public static bool OfferedInSemester(CourseData course, int semester)
    {
        if (course.AvailableSemesters.Length == 0) return true;

        var allOdd = true;
        var allEven = true;
        foreach (var s in course.AvailableSemesters)
        {
            if (s == semester) return true;
            if (s % 2 == 0) allOdd = false;
            else allEven = false;
        }
        if (allOdd) return semester % 2 != 0;
        if (allEven) return semester % 2 == 0;
        return false;
    }

    public static List<HashSet<Guid>> GroupCourseIdsByAnalog(
        HashSet<Guid> courseIds,
        Dictionary<Guid, CourseData> coursesById)
    {
        var groups = new List<HashSet<Guid>>();
        var groupIndexByAnalog = new Dictionary<string, int>();

        foreach (var id in courseIds)
        {
            if (coursesById.TryGetValue(id, out var course) && !string.IsNullOrEmpty(course.AnalogGroup))
            {
                if (groupIndexByAnalog.TryGetValue(course.AnalogGroup, out var idx))
                {
                    groups[idx].Add(id);
                    continue;
                }
                groupIndexByAnalog[course.AnalogGroup] = groups.Count;
            }
            groups.Add(new HashSet<Guid> { id });
        }

        return groups;
    }

    private static bool ContainsInt(int[] items, int target) => items.Contains(target);
}
