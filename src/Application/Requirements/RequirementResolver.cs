using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Application.Common.Models;

namespace CuRoadmap.Application.Requirements;

public class RequirementResolver
{
    private readonly IApplicationDbContext _context;

    public RequirementResolver(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<RequirementGraph> LoadGraphAsync(CancellationToken ct = default)
    {
        var boxes = await _context.GetAllBoxesAsync(ct);
        var edges = await _context.GetBoxEdgesAsync(ct);
        var courses = await _context.GetAllCoursesAsync(ct);
        return new RequirementGraph(boxes, edges, courses);
    }

    public async Task<List<Projection>> ProjectMajorRequirementsAsync(Guid majorId, CancellationToken ct = default)
    {
        var g = await LoadGraphAsync(ct);
        var major = await _context.GetMajorByIdAsync(majorId, ct);
        if (major is null || major.RequirementsBoxId is null)
            return [];

        var leaves = g.DescendantLeaves(major.RequirementsBoxId.Value);
        return leaves.Select(l =>
        {
            var title = l.CourseId is not null && g.Courses.TryGetValue(l.CourseId.Value, out var c)
                ? c.Title : string.Empty;
            return new Projection(
                l.Id, majorId, l.CourseId ?? Guid.Empty,
                l.RequirementType ?? Domain.Enums.RequirementType.MajorCore,
                l.Specializations, l.MandatorySpecializations);
        }).ToList();
    }

    public async Task<HashSet<Guid>> MajorLeafCourseIdsAsync(Guid majorId, CancellationToken ct = default)
    {
        var g = await LoadGraphAsync(ct);
        var major = await _context.GetMajorByIdAsync(majorId, ct);
        if (major is null || major.RequirementsBoxId is null) return [];

        var leaves = g.DescendantLeaves(major.RequirementsBoxId.Value);
        return leaves.Where(l => l.Kind == Domain.Enums.BoxKind.Course && l.CourseId is not null)
            .Select(l => l.CourseId!.Value)
            .ToHashSet();
    }

    public async Task<HashSet<Guid>> MajorChoiceCourseIdsAsync(Guid majorId, CancellationToken ct = default)
    {
        var g = await LoadGraphAsync(ct);
        var major = await _context.GetMajorByIdAsync(majorId, ct);
        if (major is null || major.RequirementsBoxId is null) return [];

        var leaves = g.DescendantLeaves(major.RequirementsBoxId.Value);
        return leaves
            .Where(l => l.Kind == Domain.Enums.BoxKind.Course && l.CourseId is not null
                        && l.RequirementType == Domain.Enums.RequirementType.MajorChoice)
            .Select(l => l.CourseId!.Value)
            .ToHashSet();
    }

    public async Task<HashSet<Guid>> MajorCoreCourseIdsAsync(Guid majorId, CancellationToken ct = default)
    {
        var g = await LoadGraphAsync(ct);
        var major = await _context.GetMajorByIdAsync(majorId, ct);
        if (major is null || major.RequirementsBoxId is null) return [];

        var leaves = g.DescendantLeaves(major.RequirementsBoxId.Value);
        return leaves
            .Where(l => l.Kind == Domain.Enums.BoxKind.Course && l.CourseId is not null)
            .Select(l =>
            {
                var reqType = l.RequirementType ?? Domain.Enums.RequirementType.MajorCore;
                return (l.CourseId!.Value, reqType);
            })
            .Where(x => x.reqType == Domain.Enums.RequirementType.MajorCore)
            .Select(x => x.Item1)
            .ToHashSet();
    }

    public async Task<HashSet<Guid>> SpecializationCourseIdsAsync(SpecializationData spec, CancellationToken ct = default)
    {
        if (spec.RequirementsBoxId is null) return [];

        var g = await LoadGraphAsync(ct);
        var leaves = g.DescendantLeaves(spec.RequirementsBoxId.Value);
        return leaves.Where(l => l.Kind == Domain.Enums.BoxKind.Course && l.CourseId is not null)
            .Select(l => l.CourseId!.Value)
            .ToHashSet();
    }

    public async Task<List<Guid>> ResolveTargetCourseIdsAsync(
        Guid majorId,
        Guid? specializationId,
        HashSet<Guid> passedCourseIds,
        HashSet<Guid> plannedCourseIds,
        int cohort,
        CancellationToken ct = default)
    {
        var g = await LoadGraphAsync(ct);
        var major = await _context.GetMajorByIdAsync(majorId, ct);
        if (major is null || major.RequirementsBoxId is null) return [];

        var selected = new Dictionary<Guid, ResolvedSelection>();
        ResolveBox(g, major.RequirementsBoxId.Value, passedCourseIds, plannedCourseIds, cohort, 0, selected);

        if (specializationId is not null)
        {
            var specs = await _context.GetSpecializationsByMajorAsync(majorId, ct);
            var spec = specs.FirstOrDefault(s => s.Id == specializationId.Value);
            if (spec is not null && spec.RequirementsBoxId is not null)
            {
                ResolveBox(g, spec.RequirementsBoxId.Value, passedCourseIds, plannedCourseIds, cohort, 0, selected);
            }
        }

        return selected.Values.Select(l => l.CourseId).OrderBy(id => id.ToString()).ToList();
    }

    private static void ResolveBox(
        RequirementGraph g,
        Guid boxId,
        HashSet<Guid> passedCourseIds,
        HashSet<Guid> plannedCourseIds,
        int cohort,
        int depth,
        Dictionary<Guid, ResolvedSelection> selected)
    {
        if (!g.Boxes.TryGetValue(boxId, out var box)) return;

        switch (box.Kind)
        {
            case Domain.Enums.BoxKind.Course:
                if (box.CourseId is not null)
                {
                    var course = g.Courses.GetValueOrDefault(box.CourseId.Value);
                    if (course is not null)
                    {
                        var cohortOk = course.AllowedCohorts.Length == 0 || course.AllowedCohorts.Contains(cohort);
                        if (cohortOk && !selected.ContainsKey(box.Id))
                        {
                            selected[box.Id] = new ResolvedSelection(box.CourseId.Value, box.RequirementType ?? Domain.Enums.RequirementType.MajorCore);
                        }
                    }
                }
                break;

            case Domain.Enums.BoxKind.Logical:
                if (!g.Children.TryGetValue(boxId, out var logicalChildren) || logicalChildren.Count == 0) return;
                var op = box.LogicalOp ?? Domain.Enums.LogicalOp.And;
                switch (op)
                {
                    case Domain.Enums.LogicalOp.And:
                        foreach (var edge in logicalChildren)
                            ResolveBox(g, edge.ChildBoxId, passedCourseIds, plannedCourseIds, cohort, depth + 1, selected);
                        break;
                    case Domain.Enums.LogicalOp.Or:
                    case Domain.Enums.LogicalOp.Xor:
                        var best = PickBestBranch(g, logicalChildren, passedCourseIds, plannedCourseIds, cohort);
                        if (best is not null)
                            ResolveBox(g, best.ChildBoxId, passedCourseIds, plannedCourseIds, cohort, depth + 1, selected);
                        break;
                }
                break;

            case Domain.Enums.BoxKind.Optional:
                if (!g.Children.TryGetValue(boxId, out var optChildren) || optChildren.Count == 0) return;
                ResolveOptional(g, optChildren[0].ChildBoxId, box.RequiredCount, passedCourseIds, plannedCourseIds, cohort, depth + 1, selected);
                break;
        }
    }

    private static void ResolveOptional(
        RequirementGraph g,
        Guid boxId,
        int requiredCount,
        HashSet<Guid> passedCourseIds,
        HashSet<Guid> plannedCourseIds,
        int cohort,
        int depth,
        Dictionary<Guid, ResolvedSelection> selected)
    {
        if (!g.Children.TryGetValue(boxId, out var children) || children.Count == 0) return;

        var candidates = new List<BoxEdgeData>();
        foreach (var edge in children)
        {
            if (!g.Boxes.TryGetValue(edge.ChildBoxId, out var childBox)) continue;
            if (childBox.Kind == Domain.Enums.BoxKind.Course && childBox.CourseId is not null)
            {
                var isPassedOrPlanned = passedCourseIds.Contains(childBox.CourseId.Value)
                                        || plannedCourseIds.Contains(childBox.CourseId.Value);
                if (isPassedOrPlanned)
                    candidates.Add(edge);
            }
        }

        if (candidates.Count < requiredCount)
        {
            // Fill remaining from available
            foreach (var edge in children)
            {
                if (candidates.Count >= requiredCount) break;
                if (candidates.Any(c => c.ChildBoxId == edge.ChildBoxId)) continue;
                candidates.Add(edge);
            }
        }

        foreach (var edge in candidates.Take(Math.Max(requiredCount, 1)))
        {
            ResolveBox(g, edge.ChildBoxId, passedCourseIds, plannedCourseIds, cohort, depth + 1, selected);
        }
    }

    private static BoxEdgeData? PickBestBranch(
        RequirementGraph g,
        List<BoxEdgeData> edges,
        HashSet<Guid> passedCourseIds,
        HashSet<Guid> plannedCourseIds,
        int cohort)
    {
        foreach (var edge in edges)
        {
            if (!g.Boxes.TryGetValue(edge.ChildBoxId, out var childBox)) continue;
            if (childBox.Kind == Domain.Enums.BoxKind.Course && childBox.CourseId is not null)
            {
                if (passedCourseIds.Contains(childBox.CourseId.Value) || plannedCourseIds.Contains(childBox.CourseId.Value))
                    return edge;
            }
        }

        // For XOR, pick the first one
        return edges.FirstOrDefault();
    }

    public static bool AnalogGroupsIntersect(string a, string b)
    {
        if (string.IsNullOrEmpty(a) || string.IsNullOrEmpty(b)) return false;
        var partsA = a.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        var partsB = b.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        return partsA.Any(pa => partsB.Contains(pa, StringComparer.OrdinalIgnoreCase));
    }
}

public record ResolvedSelection(Guid CourseId, Domain.Enums.RequirementType RequirementType);
