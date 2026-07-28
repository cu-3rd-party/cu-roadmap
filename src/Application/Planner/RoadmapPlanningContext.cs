using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Application.Common.Models;
using CuRoadmap.Application.Requirements;

namespace CuRoadmap.Application.Planner;

public delegate List<Guid> SemesterSelectionStrategy(RoadmapPlanningContext ctx, int semester);

public class RoadmapPlanningContext
{
    public IApplicationDbContext Context { get; }
    public Dictionary<Guid, CourseData> TargetCourses { get; set; } = new();
    public Dictionary<Guid, Dictionary<int, List<Guid>>> PrereqGroups { get; set; } = new();
    public Dictionary<Guid, Dictionary<int, List<Guid>>> Coreqs { get; set; } = new();
    public Dictionary<Guid, int> UnlocksCount { get; set; } = new();
    public HashSet<Guid> PassedIds { get; set; } = new();
    public Dictionary<Guid, CourseData> CoursesTodo { get; set; } = new();
    public HashSet<Guid> CoreCourseIds { get; set; } = new();
    public HashSet<Guid> ReservedForFuture { get; set; } = new();
    public double MaxLoad { get; set; }

    public RoadmapPlanningContext(IApplicationDbContext context)
    {
        Context = context;
    }
}

public static class RoadmapPlannerImpl
{
    public static async Task<(RoadmapPlanningContext? Ctx, object? Immediate)> NewRoadmapPlanningContextAsync(
        IApplicationDbContext context,
        List<Guid> passedCourseIds,
        List<PlannedSemester> plannedSemesters,
        Guid majorId,
        Guid? specializationId,
        double maxLoad,
        int cohort,
        CancellationToken ct = default)
    {
        var resolver = new RequirementResolver(context);
        var projectedRequirements = await resolver.ProjectMajorRequirementsAsync(majorId, ct);
        var targetCourseIds = await resolver.ResolveTargetCourseIdsAsync(
            majorId, specializationId,
            passedCourseIds.ToHashSet(),
            plannedSemesters.SelectMany(s => s.CourseIds).ToHashSet(),
            cohort, ct);

        if (projectedRequirements.Count == 0 && targetCourseIds.Count == 0)
            return (null, new Dictionary<string, object> { ["error"] = "Major requirements not found" });

        var allCourses = await context.GetAllCoursesAsync(ct);

        // Auto-inject mandatory courses marked with ОБЯЗ:
        foreach (var c in allCourses.Values)
        {
            var upperGroup = c.AnalogGroup.ToUpperInvariant();
            if (upperGroup.Contains("ОБЯЗ&ВРУЧНУЮ:")) continue;
            if (upperGroup.Contains("ОБЯЗ:"))
            {
                if (!targetCourseIds.Contains(c.Id))
                    targetCourseIds.Add(c.Id);
            }
        }

        var passedIds = passedCourseIds.ToHashSet();
        var plannedIds = plannedSemesters.SelectMany(s => s.CourseIds).ToHashSet();

        // Track fulfilled analog groups
        var fulfilledAnalogGroups = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var id in passedCourseIds)
        {
            if (allCourses.TryGetValue(id, out var c) && !string.IsNullOrEmpty(c.AnalogGroup))
                MarkFulfilled(c.AnalogGroup, fulfilledAnalogGroups);
        }
        foreach (var ps in plannedSemesters)
        {
            foreach (var id in ps.CourseIds)
            {
                if (allCourses.TryGetValue(id, out var c) && !string.IsNullOrEmpty(c.AnalogGroup))
                    MarkFulfilled(c.AnalogGroup, fulfilledAnalogGroups);
            }
        }

        // Build target courses map
        var targetCourses = new Dictionary<Guid, CourseData>();
        var coreCourseIds = new HashSet<Guid>();
        foreach (var courseId in targetCourseIds)
        {
            if (!allCourses.TryGetValue(courseId, out var c)) continue;
            if (cohort != 0 && c.AllowedCohorts.Length > 0 && !c.AllowedCohorts.Contains(cohort)) continue;
            if (!string.IsNullOrEmpty(c.AnalogGroup) && HasFulfilledGroup(c.AnalogGroup, fulfilledAnalogGroups))
            {
                if (!passedIds.Contains(courseId) && !plannedIds.Contains(courseId))
                    continue;
            }
            targetCourses[courseId] = c;
        }

        // Identify core courses
        var specTitle = string.Empty;
        if (specializationId is not null)
        {
            var specs = await context.GetSpecializationsByMajorAsync(majorId, ct);
            var spec = specs.FirstOrDefault(s => s.Id == specializationId.Value);
            if (spec is not null) specTitle = spec.Title;
        }

        foreach (var req in projectedRequirements)
        {
            if (plannedIds.Contains(req.CourseId)) continue;
            var isCore = req.RequirementType == Domain.Enums.RequirementType.MajorCore
                         || req.RequirementType == Domain.Enums.RequirementType.University;
            if (!isCore && !string.IsNullOrEmpty(specTitle) && req.RequirementType == Domain.Enums.RequirementType.MajorChoice)
            {
                isCore = req.MandatorySpecializations.Any(ms =>
                    ms.Equals(specTitle, StringComparison.OrdinalIgnoreCase));
            }
            if (isCore) coreCourseIds.Add(req.CourseId);
        }

        // Build dependency maps
        var allDeps = await context.GetCourseDependenciesAsync(ct);
        var unlocksCount = new Dictionary<Guid, int>();
        var prereqGroups = new Dictionary<Guid, Dictionary<int, List<Guid>>>();
        var coreqs = new Dictionary<Guid, Dictionary<int, List<Guid>>>();
        var mandatoryReqs = new HashSet<Guid>();

        foreach (var dep in allDeps)
        {
            switch (dep.DependencyType)
            {
                case Domain.Enums.DependencyType.Prerequisite:
                    if (!prereqGroups.ContainsKey(dep.CourseId))
                        prereqGroups[dep.CourseId] = new Dictionary<int, List<Guid>>();
                    if (!prereqGroups[dep.CourseId].ContainsKey(dep.AlternativeGroup))
                        prereqGroups[dep.CourseId][dep.AlternativeGroup] = new List<Guid>();
                    prereqGroups[dep.CourseId][dep.AlternativeGroup].Add(dep.RequiredCourseId);
                    if (dep.AlternativeGroup == 0) mandatoryReqs.Add(dep.RequiredCourseId);
                    if (!unlocksCount.ContainsKey(dep.RequiredCourseId))
                        unlocksCount[dep.RequiredCourseId] = 0;
                    unlocksCount[dep.RequiredCourseId]++;
                    break;
                case Domain.Enums.DependencyType.Corequisite:
                    if (!coreqs.ContainsKey(dep.CourseId))
                        coreqs[dep.CourseId] = new Dictionary<int, List<Guid>>();
                    if (!coreqs[dep.CourseId].ContainsKey(dep.AlternativeGroup))
                        coreqs[dep.CourseId][dep.AlternativeGroup] = new List<Guid>();
                    coreqs[dep.CourseId][dep.AlternativeGroup].Add(dep.RequiredCourseId);
                    if (dep.AlternativeGroup == 0) mandatoryReqs.Add(dep.RequiredCourseId);
                    break;
            }
        }

        if (targetCourses.Count == 0)
        {
            return (new RoadmapPlanningContext(context)
            {
                TargetCourses = targetCourses,
                PrereqGroups = prereqGroups,
                Coreqs = coreqs,
                UnlocksCount = unlocksCount,
                PassedIds = passedIds,
                CoursesTodo = new Dictionary<Guid, CourseData>(),
                CoreCourseIds = coreCourseIds,
                ReservedForFuture = new HashSet<Guid>(),
                MaxLoad = maxLoad
            }, null);
        }

        // Prune analog group duplicates
        var analogGroupKeepers = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);
        foreach (var id in passedIds)
        {
            if (allCourses.TryGetValue(id, out var c) && !string.IsNullOrEmpty(c.AnalogGroup))
                AddKeepers(c.AnalogGroup, id, analogGroupKeepers);
        }
        foreach (var id in plannedIds)
        {
            if (allCourses.TryGetValue(id, out var c) && !string.IsNullOrEmpty(c.AnalogGroup))
                AddKeepers(c.AnalogGroup, id, analogGroupKeepers);
        }

        var toRemove = new List<Guid>();
        foreach (var (reqCourseId, reqCourse) in targetCourses)
        {
            if (string.IsNullOrEmpty(reqCourse.AnalogGroup)) continue;
            if (FindKeeper(reqCourse.AnalogGroup, analogGroupKeepers, out var existingId))
            {
                if (passedIds.Contains(existingId) || plannedIds.Contains(existingId))
                {
                    toRemove.Add(reqCourseId);
                    coreCourseIds.Remove(reqCourseId);
                }
                else
                {
                    var shouldReplace = false;
                    if (mandatoryReqs.Contains(reqCourseId) && !mandatoryReqs.Contains(existingId))
                        shouldReplace = true;
                    else if (mandatoryReqs.Contains(reqCourseId) == mandatoryReqs.Contains(existingId))
                    {
                        var reqUnlocks = unlocksCount.GetValueOrDefault(reqCourseId, 0);
                        var existingUnlocks = unlocksCount.GetValueOrDefault(existingId, 0);
                        if (reqUnlocks > existingUnlocks)
                            shouldReplace = true;
                    }

                    if (shouldReplace)
                    {
                        toRemove.Add(existingId);
                        coreCourseIds.Remove(existingId);
                        AddKeepers(reqCourse.AnalogGroup, reqCourseId, analogGroupKeepers);
                    }
                    else
                    {
                        toRemove.Add(reqCourseId);
                        coreCourseIds.Remove(reqCourseId);
                    }
                }
            }
            else
            {
                AddKeepers(reqCourse.AnalogGroup, reqCourseId, analogGroupKeepers);
            }
        }
        foreach (var id in toRemove) targetCourses.Remove(id);

        // Resolve dependencies recursively
        var initialIds = targetCourses.Keys.ToList();
        foreach (var cid in initialIds)
        {
            ResolveDependencies(cid, coreCourseIds.Contains(cid), targetCourses, allCourses,
                prereqGroups, coreqs, passedIds, plannedIds, coreCourseIds,
                mandatoryReqs, unlocksCount, cohort);
        }

        var coursesTodo = targetCourses
            .Where(kvp => !passedIds.Contains(kvp.Key))
            .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);

        return (new RoadmapPlanningContext(context)
        {
            TargetCourses = targetCourses,
            PrereqGroups = prereqGroups,
            Coreqs = coreqs,
            UnlocksCount = unlocksCount,
            PassedIds = passedIds,
            CoursesTodo = coursesTodo,
            CoreCourseIds = coreCourseIds,
            ReservedForFuture = new HashSet<Guid>(),
            MaxLoad = maxLoad
        }, null);
    }

    public static async Task<object> GenerateRoadmapWithStrategyAsync(
        IApplicationDbContext context,
        List<Guid> passedCourseIds,
        List<PlannedSemester> plannedSemesters,
        Guid majorId,
        Guid? specializationId,
        int currentSemester,
        double maxLoad,
        int cohort,
        SemesterSelectionStrategy selectSemester,
        CancellationToken ct = default)
    {
        var (ctx, immediate) = await NewRoadmapPlanningContextAsync(
            context, passedCourseIds, plannedSemesters,
            majorId, specializationId, maxLoad, cohort, ct);

        if (ctx is null || immediate is not null)
            return immediate ?? new Dictionary<string, object> { ["error"] = "Planning failed" };

        if (ctx.CoursesTodo.Count == 0)
            return new List<Dictionary<string, object>>();

        var plannedBySem = new Dictionary<int, List<Guid>>();
        var allCourses = await context.GetAllCoursesAsync(ct);

        foreach (var ps in plannedSemesters)
        {
            if (!plannedBySem.ContainsKey(ps.Semester))
                plannedBySem[ps.Semester] = new List<Guid>();
            foreach (var cid in ps.CourseIds)
            {
                plannedBySem[ps.Semester].Add(cid);
                if (!ctx.PassedIds.Contains(cid))
                {
                    ctx.ReservedForFuture.Add(cid);
                    if (!ctx.CoursesTodo.ContainsKey(cid) && allCourses.TryGetValue(cid, out var c))
                        ctx.CoursesTodo[cid] = c;
                }
            }
        }

        // Force mandatory exclusive-semester courses
        var forcedCourseIds = new Dictionary<Guid, int>();
        foreach (var (cid, course) in ctx.CoursesTodo)
        {
            if (!ShouldAutoForceExclusiveSemester(course, allCourses)) continue;
            if (course.AvailableSemesters is not [var forcedSem]) continue;
            if (plannedBySem.TryGetValue(forcedSem, out var existing) && existing.Contains(cid)) continue;
            forcedCourseIds[cid] = forcedSem;
            var semester = course.AvailableSemesters[0];
            forcedCourseIds[cid] = semester;
            ctx.ReservedForFuture.Add(cid);
        }

        foreach (var (cid, semester) in forcedCourseIds)
        {
            if (!plannedBySem.ContainsKey(semester))
                plannedBySem[semester] = new List<Guid>();
            if (!plannedBySem[semester].Contains(cid))
                plannedBySem[semester].Add(cid);
        }

        var roadmap = new List<Dictionary<string, object>>();

        // Backfill past semesters
        var backfillSemesters = new HashSet<int>();
        foreach (var sem in plannedBySem.Keys.Where(s => s < currentSemester))
            backfillSemesters.Add(sem);
        foreach (var sem in forcedCourseIds.Values.Where(s => s < currentSemester))
            backfillSemesters.Add(sem);

        foreach (var semester in backfillSemesters.OrderBy(s => s))
        {
            double semLoad = 0;
            var courseIds = new List<string>();
            var newlyPassed = new List<Guid>();

            if (plannedBySem.TryGetValue(semester, out var planned))
            {
                foreach (var cid in planned)
                {
                    if (ctx.CoursesTodo.TryGetValue(cid, out var course))
                    {
                        courseIds.Add(cid.ToString());
                        semLoad += course.Workload;
                        newlyPassed.Add(cid);
                        ctx.CoursesTodo.Remove(cid);
                        ctx.ReservedForFuture.Remove(cid);
                    }
                }
                plannedBySem.Remove(semester);
            }

            foreach (var cid in newlyPassed) ctx.PassedIds.Add(cid);

            if (courseIds.Count > 0)
            {
                roadmap.Add(new Dictionary<string, object>
                {
                    ["semester"] = semester,
                    ["course_ids"] = courseIds,
                    ["total_load"] = semLoad
                });
            }
        }

        // Main planning loop
        for (var semester = currentSemester;
             (ctx.CoursesTodo.Count > 0 || plannedBySem.Count > 0) && semester <= 12;
             semester++)
        {
            double semLoad = 0;
            var courseIds = new List<string>();
            var newlyPassed = new List<Guid>();

            if (plannedBySem.TryGetValue(semester, out var planned))
            {
                foreach (var cid in planned)
                {
                    if (ctx.CoursesTodo.TryGetValue(cid, out var course))
                    {
                        courseIds.Add(cid.ToString());
                        semLoad += course.Workload;
                        newlyPassed.Add(cid);
                        ctx.CoursesTodo.Remove(cid);
                        ctx.ReservedForFuture.Remove(cid);
                    }
                }
                plannedBySem.Remove(semester);
            }

            var originalMaxLoad = ctx.MaxLoad;
            ctx.MaxLoad = Math.Max(0, originalMaxLoad - semLoad);
            var selected = selectSemester(ctx, semester);
            ctx.MaxLoad = originalMaxLoad;

            foreach (var cid in selected)
            {
                if (!ctx.CoursesTodo.TryGetValue(cid, out var course)) continue;
                courseIds.Add(cid.ToString());
                semLoad += course.Workload;
                newlyPassed.Add(cid);
                ctx.CoursesTodo.Remove(cid);
            }

            foreach (var cid in newlyPassed) ctx.PassedIds.Add(cid);

            if (courseIds.Count > 0)
            {
                roadmap.Add(new Dictionary<string, object>
                {
                    ["semester"] = semester,
                    ["course_ids"] = courseIds,
                    ["total_load"] = semLoad
                });
            }
        }

        // Check for missing core courses
        foreach (var cid in ctx.CoreCourseIds)
        {
            if (ctx.CoursesTodo.ContainsKey(cid))
            {
                var courseName = ctx.TargetCourses.GetValueOrDefault(cid)?.Title ?? "Unknown";
                throw new InvalidOperationException(
                    $"Не удалось добавить обязательный курс '{courseName}' в план (проверьте семестры или пререквизиты)");
            }
        }

        return roadmap;
    }

    public static List<SemesterBundle> AvailableCourseBundles(RoadmapPlanningContext ctx, int semester)
    {
        var available = ctx.CoursesTodo
            .Where(kvp => !ctx.ReservedForFuture.Contains(kvp.Key)
                          && PrereqsSatisfied(ctx, kvp.Key)
                          && OfferedInSemester(kvp.Value, semester)
                          && CoreqsSchedulable(ctx, kvp.Key, semester))
            .Select(kvp => kvp.Value)
            .ToList();

        var bundlesByKey = new Dictionary<string, SemesterBundle>();
        foreach (var c in available)
        {
            var bundle = BuildBundle(ctx, c.Id, semester);
            if (bundle is null || bundle.Load > ctx.MaxLoad) continue;
            var key = BundleKey(bundle.CourseIds);
            if (!bundlesByKey.ContainsKey(key))
            {
                bundlesByKey[key] = bundle with { Score = BundleScore(ctx, bundle.CourseIds, semester) };
            }
        }

        return bundlesByKey.Values
            .OrderByDescending(b => b.Score)
            .ThenBy(b => b.Load)
            .ThenBy(b => BundleKey(b.CourseIds))
            .ToList();
    }

    public static List<Guid> SelectGreedySemester(RoadmapPlanningContext ctx, int semester)
    {
        var bundles = AvailableCourseBundles(ctx, semester);
        var selected = new List<Guid>();
        var selectedSet = new HashSet<Guid>();
        var remainingLoad = ctx.MaxLoad;

        foreach (var bundle in bundles)
        {
            if (bundle.Load > remainingLoad || Overlaps(selectedSet, bundle.CourseIds))
                continue;
            foreach (var cid in bundle.CourseIds)
            {
                if (selectedSet.Add(cid))
                    selected.Add(cid);
            }
            remainingLoad -= bundle.Load;
        }

        return selected;
    }

    public static List<Guid> SelectDPSemester(RoadmapPlanningContext ctx, int semester)
    {
        var bundles = AvailableCourseBundles(ctx, semester);
        if (bundles.Count == 0) return [];

        var scale = 2.0;
        var capacity = (int)Math.Round(ctx.MaxLoad * scale);

        var dp = new (double Score, List<int> Pick)[capacity + 1];
        for (var i = 0; i <= capacity; i++)
            dp[i].Score = double.NegativeInfinity;
        dp[0].Score = 0;

        for (var i = 0; i < bundles.Count; i++)
        {
            var weight = (int)Math.Round(bundles[i].Load * scale);
            for (var cap = capacity; cap >= weight; cap--)
            {
                var prev = dp[cap - weight];
                if (double.IsNegativeInfinity(prev.Score)) continue;
                if (OverlapsWithPicks(prev.Pick, bundles, bundles[i].CourseIds)) continue;

                var candidate = prev.Score + bundles[i].Score;
                if (candidate > dp[cap].Score)
                {
                    var nextPick = new List<int>(prev.Pick) { i };
                    dp[cap] = (candidate, nextPick);
                }
            }
        }

        var best = dp[0];
        foreach (var st in dp)
        {
            if (st.Score > best.Score) best = st;
        }

        return FlattenBundlePicks(best.Pick, bundles);
    }

    public static List<Guid> SelectILPSemester(RoadmapPlanningContext ctx, int semester)
    {
        var bundles = AvailableCourseBundles(ctx, semester);
        if (bundles.Count == 0) return [];

        double bestScore = 0;
        var best = new List<Guid>();
        var selectedSet = new HashSet<Guid>();

        void Search(int index, double remainingLoad, double currentScore, List<Guid> current)
        {
            if (index == bundles.Count)
            {
                if (currentScore > bestScore)
                {
                    bestScore = currentScore;
                    best = new List<Guid>(current);
                }
                return;
            }

            var upperBound = currentScore;
            for (var i = index; i < bundles.Count; i++)
                upperBound += Math.Max(bundles[i].Score, 0);

            if (upperBound <= bestScore) return;

            Search(index + 1, remainingLoad, currentScore, current);

            var bundle = bundles[index];
            if (bundle.Load > remainingLoad || Overlaps(selectedSet, bundle.CourseIds)) return;

            foreach (var cid in bundle.CourseIds) selectedSet.Add(cid);
            var next = new List<Guid>(current);
            next.AddRange(bundle.CourseIds);
            Search(index + 1, remainingLoad - bundle.Load, currentScore + bundle.Score, next);
            foreach (var cid in bundle.CourseIds) selectedSet.Remove(cid);
        }

        Search(0, ctx.MaxLoad, 0, new List<Guid>());
        return best.Distinct().ToList();
    }

    public static List<Guid> SelectLPRelaxationSemester(RoadmapPlanningContext ctx, int semester)
    {
        var bundles = AvailableCourseBundles(ctx, semester);
        if (bundles.Count == 0) return [];

        bundles = bundles
            .OrderByDescending(b => b.Score / Math.Max(b.Load, 1))
            .ThenByDescending(b => b.Score)
            .ToList();

        var fractionalPriority = new Dictionary<Guid, double>();
        var remaining = ctx.MaxLoad;
        foreach (var bundle in bundles)
        {
            var fraction = Math.Min(1, remaining / Math.Max(bundle.Load, 1e-9));
            if (fraction <= 0) continue;
            foreach (var cid in bundle.CourseIds)
            {
                if (!fractionalPriority.ContainsKey(cid))
                    fractionalPriority[cid] = 0;
                fractionalPriority[cid] += fraction * bundle.Score / bundle.CourseIds.Count;
            }
            remaining -= Math.Min(bundle.Load, remaining);
            if (remaining <= 0) break;
        }

        for (var i = 0; i < bundles.Count; i++)
        {
            bundles[i] = bundles[i] with
            {
                Score = bundles[i].CourseIds.Sum(cid => fractionalPriority.GetValueOrDefault(cid, 0))
            };
        }

        bundles = bundles.OrderByDescending(b => b.Score / Math.Max(b.Load, 1)).ToList();

        var selected = new List<Guid>();
        var selectedSet = new HashSet<Guid>();
        remaining = ctx.MaxLoad;

        foreach (var bundle in bundles)
        {
            if (bundle.Load > remaining || Overlaps(selectedSet, bundle.CourseIds)) continue;
            foreach (var cid in bundle.CourseIds)
            {
                if (selectedSet.Add(cid))
                    selected.Add(cid);
            }
            remaining -= bundle.Load;
        }

        return selected;
    }

    private static void ResolveDependencies(
        Guid cid, bool parentIsCore,
        Dictionary<Guid, CourseData> targetCourses,
        Dictionary<Guid, CourseData> allCourses,
        Dictionary<Guid, Dictionary<int, List<Guid>>> prereqGroups,
        Dictionary<Guid, Dictionary<int, List<Guid>>> coreqs,
        HashSet<Guid> passedIds, HashSet<Guid> plannedIds,
        HashSet<Guid> coreCourseIds,
        HashSet<Guid> mandatoryReqs,
        Dictionary<Guid, int> unlocksCount,
        int cohort)
    {
        void ResolveGroup(Dictionary<int, List<Guid>> groups, bool isCore)
        {
            foreach (var (groupNum, altIds) in groups)
            {
                if (groupNum == 0)
                {
                    foreach (var reqId in altIds)
                    {
                        if (isCore) coreCourseIds.Add(reqId);
                        if (targetCourses.ContainsKey(reqId))
                        {
                            if (isCore && !coreCourseIds.Contains(reqId))
                            {
                                coreCourseIds.Add(reqId);
                                ResolveDependencies(reqId, true, targetCourses, allCourses,
                                    prereqGroups, coreqs, passedIds, plannedIds,
                                    coreCourseIds, mandatoryReqs, unlocksCount, cohort);
                            }
                            continue;
                        }
                        if (!allCourses.TryGetValue(reqId, out var c)) continue;
                        if (cohort != 0 && c.AllowedCohorts.Length > 0 && !c.AllowedCohorts.Contains(cohort)) continue;
                        targetCourses[reqId] = c;
                        ResolveDependencies(reqId, isCore, targetCourses, allCourses,
                            prereqGroups, coreqs, passedIds, plannedIds,
                            coreCourseIds, mandatoryReqs, unlocksCount, cohort);
                    }
                }
                else
                {
                    Guid? pickedReqId = null;
                    foreach (var reqId in altIds)
                    {
                        if (passedIds.Contains(reqId) || plannedIds.Contains(reqId) || targetCourses.ContainsKey(reqId))
                        {
                            pickedReqId = reqId;
                            break;
                        }
                    }

                    if (pickedReqId is null)
                    {
                        pickedReqId = altIds.FirstOrDefault(mandatoryReqs.Contains);

                        if (pickedReqId is null)
                        {
                            pickedReqId = altIds.FirstOrDefault(reqId =>
                            {
                                if (!allCourses.TryGetValue(reqId, out var c)) return true;
                                if (string.IsNullOrEmpty(c.AnalogGroup)) return true;
                                return !targetCourses.Values.Any(tc =>
                                    RequirementResolver.AnalogGroupsIntersect(tc.AnalogGroup, c.AnalogGroup));
                            });
                        }

                        pickedReqId ??= altIds[0];
                    }

                    if (pickedReqId is null) continue;
                    var reqIdVal = pickedReqId.Value;

                    if (isCore) coreCourseIds.Add(reqIdVal);
                    if (targetCourses.ContainsKey(reqIdVal))
                    {
                        if (isCore && !coreCourseIds.Contains(reqIdVal))
                        {
                            coreCourseIds.Add(reqIdVal);
                            ResolveDependencies(reqIdVal, true, targetCourses, allCourses,
                                prereqGroups, coreqs, passedIds, plannedIds,
                                coreCourseIds, mandatoryReqs, unlocksCount, cohort);
                        }
                        continue;
                    }
                    if (!allCourses.TryGetValue(reqIdVal, out var c2)) continue;
                    if (cohort != 0 && c2.AllowedCohorts.Length > 0 && !c2.AllowedCohorts.Contains(cohort)) continue;
                    targetCourses[reqIdVal] = c2;
                    ResolveDependencies(reqIdVal, isCore, targetCourses, allCourses,
                        prereqGroups, coreqs, passedIds, plannedIds,
                        coreCourseIds, mandatoryReqs, unlocksCount, cohort);
                }
            }
        }

        if (prereqGroups.TryGetValue(cid, out var prereqs))
            ResolveGroup(prereqs, parentIsCore);

        if (coreqs.TryGetValue(cid, out var coreqGroups))
            ResolveGroup(coreqGroups, parentIsCore);
    }

    public static bool PrereqsSatisfied(RoadmapPlanningContext ctx, Guid cid)
    {
        if (!ctx.PrereqGroups.TryGetValue(cid, out var groups)) return true;

        foreach (var (groupNum, altIds) in groups)
        {
            if (groupNum == 0)
            {
                if (altIds.Any(reqId => !ctx.PassedIds.Contains(reqId)))
                    return false;
            }
            else
            {
                if (altIds.All(reqId => !ctx.PassedIds.Contains(reqId)))
                    return false;
            }
        }
        return true;
    }

    public static bool CoreqsSchedulable(RoadmapPlanningContext ctx, Guid cid, int semester)
    {
        if (!ctx.Coreqs.TryGetValue(cid, out var groups)) return true;

        foreach (var (_, altIds) in groups)
        {
            var anySchedulable = altIds.Any(reqId =>
                ctx.PassedIds.Contains(reqId)
                || ctx.ReservedForFuture.Contains(reqId)
                || (ctx.CoursesTodo.TryGetValue(reqId, out var reqCourse)
                    && PrereqsSatisfied(ctx, reqId)
                    && OfferedInSemester(reqCourse, semester))
                || (HasEquivalentPrerequisiteRelation(ctx, cid, reqId)
                    && ctx.CoursesTodo.TryGetValue(reqId, out var eqCourse)
                    && OfferedInSemester(eqCourse, semester)));

            if (!anySchedulable) return false;
        }
        return true;
    }

    private static bool HasEquivalentPrerequisiteRelation(RoadmapPlanningContext ctx, Guid courseId, Guid requiredCourseId)
    {
        if (!ctx.PrereqGroups.TryGetValue(courseId, out var groups)) return false;
        return groups.Values.Any(altIds => altIds.Contains(requiredCourseId));
    }

    public static bool ShouldAutoForceExclusiveSemester(CourseData course, Dictionary<Guid, CourseData> allCourses)
    {
        if (course.Category != Domain.Enums.CourseCategory.Fundamentals) return false;
        if (!course.AnalogGroup.ToUpperInvariant().Contains("ОБЯЗ:")) return false;
        if (course.AvailableSemesters.Length != 1) return false;
        if (string.IsNullOrEmpty(course.AnalogGroup.Trim())) return false;

        var group = course.AnalogGroup.Trim();
        var count = allCourses.Values.Count(other =>
            other.Id != course.Id && RequirementResolver.AnalogGroupsIntersect(other.AnalogGroup, group));
        return count == 0;
    }

    public static SemesterBundle? BuildBundle(RoadmapPlanningContext ctx, Guid cid, int semester)
    {
        var bundleSet = new HashSet<Guid>();
        var queue = new Queue<Guid>();
        queue.Enqueue(cid);
        double load = 0;

        while (queue.Count > 0)
        {
            var curr = queue.Dequeue();
            if (bundleSet.Contains(curr) || ctx.PassedIds.Contains(curr)) continue;
            if (!ctx.CoursesTodo.TryGetValue(curr, out var course)) continue;
            if (!PrereqsSatisfied(ctx, curr) || !OfferedInSemester(course, semester))
                return null;

            bundleSet.Add(curr);
            load += course.Workload;

            if (ctx.Coreqs.TryGetValue(curr, out var coreqGroups))
            {
                foreach (var (_, altIds) in coreqGroups)
                {
                    Guid? pickedReqId = null;
                    foreach (var reqId in altIds)
                    {
                        if (ctx.PassedIds.Contains(reqId))
                        {
                            pickedReqId = reqId;
                            break;
                        }
                        if (ctx.CoursesTodo.ContainsKey(reqId))
                        {
                            pickedReqId = reqId;
                            break;
                        }
                    }
                    if (pickedReqId is null) return null;
                    if (!ctx.PassedIds.Contains(pickedReqId.Value))
                        queue.Enqueue(pickedReqId.Value);
                }
            }
        }

        var courseIds = bundleSet.OrderBy(x => x.ToString()).ToList();
        return new SemesterBundle(courseIds, load, 0);
    }

    public static bool OfferedInSemester(CourseData c, int semester)
    {
        if (c.AvailableSemesters.Length == 0) return true;

        var allOdd = true;
        var allEven = true;
        foreach (var s in c.AvailableSemesters)
        {
            if (s == semester) return true;
            if (s % 2 == 0) allOdd = false;
            else allEven = false;
        }
        if (allOdd) return semester % 2 != 0;
        if (allEven) return semester % 2 == 0;
        return false;
    }

    public static double BundleScore(RoadmapPlanningContext ctx, List<Guid> courseIds, int semester)
    {
        double score = 0;
        foreach (var cid in courseIds)
        {
            if (!ctx.TargetCourses.TryGetValue(cid, out var course)) continue;

            var recommendedBonus = course.RecommendedSemester.HasValue
                ? 1.0 / (course.RecommendedSemester.Value + 1)
                : 0;

            double obyazBonus = 0;
            if (course.AnalogGroup.ToUpperInvariant().Contains("ОБЯЗ:"))
            {
                obyazBonus = semester <= 4 ? 1000 : 500;
            }

            score += 10 + ctx.UnlocksCount.GetValueOrDefault(cid, 0) * 3
                     + recommendedBonus - course.Workload * 0.1 + obyazBonus;
        }
        return score;
    }

    private static bool Overlaps(HashSet<Guid> existing, List<Guid> candidate)
        => candidate.Any(existing.Contains);

    private static bool OverlapsWithPicks(List<int> picks, List<SemesterBundle> bundles, List<Guid> candidate)
    {
        var seen = picks.SelectMany(idx => bundles[idx].CourseIds).ToHashSet();
        return Overlaps(seen, candidate);
    }

    private static List<Guid> FlattenBundlePicks(List<int> picks, List<SemesterBundle> bundles)
    {
        var seen = new HashSet<Guid>();
        var result = new List<Guid>();
        foreach (var idx in picks)
        {
            foreach (var cid in bundles[idx].CourseIds)
            {
                if (seen.Add(cid))
                    result.Add(cid);
            }
        }
        return result;
    }

    private static string BundleKey(List<Guid> courseIds)
        => string.Join(",", courseIds.OrderBy(x => x.ToString()));

    private static bool HasFulfilledGroup(string analogGroup, HashSet<string> fulfilledGroups)
    {
        return analogGroup.Split(',', StringSplitOptions.TrimEntries)
            .Where(p => !string.IsNullOrEmpty(p))
            .Any(p => fulfilledGroups.Contains(p));
    }

    private static void MarkFulfilled(string analogGroup, HashSet<string> fulfilledGroups)
    {
        foreach (var part in analogGroup.Split(',', StringSplitOptions.TrimEntries))
        {
            if (!string.IsNullOrEmpty(part))
                fulfilledGroups.Add(part);
        }
    }

    private static void AddKeepers(string analogGroup, Guid id, Dictionary<string, Guid> keepers)
    {
        foreach (var part in analogGroup.Split(',', StringSplitOptions.TrimEntries))
        {
            if (!string.IsNullOrEmpty(part))
                keepers[part] = id;
        }
    }

    private static bool FindKeeper(string analogGroup, Dictionary<string, Guid> keepers, out Guid id)
    {
        foreach (var part in analogGroup.Split(',', StringSplitOptions.TrimEntries))
        {
            if (!string.IsNullOrEmpty(part) && keepers.TryGetValue(part, out id))
                return true;
        }
        id = Guid.Empty;
        return false;
    }
}

public record SemesterBundle(List<Guid> CourseIds, double Load, double Score);
