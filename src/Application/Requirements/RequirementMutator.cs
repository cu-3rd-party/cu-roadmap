using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Application.Common.Models;
using Microsoft.EntityFrameworkCore;

namespace CuRoadmap.Application.Requirements;

public class RequirementMutator
{
    private readonly IApplicationDbContext _context;

    public RequirementMutator(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddFlatRequirementAsync(Guid majorId, FlatRequirementInput req, CancellationToken ct = default)
    {
        var major = await _context.GetMajorByIdAsync(majorId, ct);
        if (major is null) return;

        var leaf = await _context.CreateBoxAsync(new BoxData(
            req.Id == Guid.Empty ? Guid.NewGuid() : req.Id,
            Domain.Enums.BoxKind.Course,
            string.Empty,
            req.CourseId,
            null,
            0,
            req.RequirementType,
            req.Specializations,
            req.MandatorySpecializations,
            null,
            null), ct);

        var edges = await _context.GetBoxEdgesAsync(ct);
        var allSpecs = MergeStringsUnique(req.Specializations.ToList(), req.MandatorySpecializations.ToList());

        if (major.RequirementsBoxId is not null && (req.RequirementType != Domain.Enums.RequirementType.MajorChoice || allSpecs.Count == 0))
        {
            var position = NextPosition(edges, major.RequirementsBoxId.Value);
            await _context.CreateBoxEdgeAsync(new BoxEdgeData(Guid.NewGuid(), major.RequirementsBoxId.Value, leaf.Id, position), ct);
        }

        if (req.RequirementType == Domain.Enums.RequirementType.MajorChoice && allSpecs.Count > 0)
        {
            var specs = await _context.GetSpecializationsByMajorAsync(majorId, ct);
            foreach (var specTitle in allSpecs)
            {
                var spec = specs.FirstOrDefault(s => s.Title.Equals(specTitle, StringComparison.OrdinalIgnoreCase));
                if (spec is null || spec.RequirementsBoxId is null) continue;
                var position = NextPosition(edges, spec.RequirementsBoxId.Value);
                await _context.CreateBoxEdgeAsync(new BoxEdgeData(Guid.NewGuid(), spec.RequirementsBoxId.Value, leaf.Id, position), ct);
            }
        }
    }

    public async Task ReplaceFlatRequirementsAsync(Guid majorId, List<FlatRequirementInput> reqs, CancellationToken ct = default)
    {
        var boxes = await _context.GetAllBoxesAsync(ct);

        // Clear existing requirements for this major
        var major = await _context.GetMajorByIdAsync(majorId, ct);
        if (major is null) return;

        var edges = await _context.GetBoxEdgesAsync(ct);

        // Remove existing tree for this major
        if (major.RequirementsBoxId is not null)
        {
            var toRemove = new HashSet<Guid>();
            CollectDescendantBoxIds(boxes, edges, major.RequirementsBoxId.Value, toRemove);
            foreach (var removeId in toRemove)
            {
                await _context.DeleteBoxEdgesByChildAsync(removeId, ct);
                await _context.DeleteBoxEdgesByParentAsync(removeId, ct);
            }
            foreach (var removeId in toRemove.OrderByDescending(id => id))
            {
                await _context.DeleteBoxAsync(removeId, ct);
            }
        }

        // Rebuild
        if (reqs.Count == 0) return;

        // Create an AND operator as root
        var rootBox = await _context.CreateBoxAsync(new BoxData(
            Guid.NewGuid(),
            Domain.Enums.BoxKind.Logical,
            string.Empty,
            null,
            Domain.Enums.LogicalOp.And,
            0,
            null,
            Array.Empty<string>(),
            Array.Empty<string>(),
            null,
            null), ct);

        var majorEntity = await _context.Majors.FirstOrDefaultAsync(m => m.Id == majorId, ct);
        if (majorEntity is not null)
        {
            majorEntity.RequirementsBoxId = rootBox.Id;
            await _context.SaveChangesAsync(ct);
        }

        foreach (var req in reqs)
        {
            await AddFlatRequirementAsync(majorId, req, ct);
        }
    }

    public static int NextPosition(List<BoxEdgeData> edges, Guid parentBoxId)
    {
        var existing = edges.Where(e => e.ParentBoxId == parentBoxId).ToList();
        return existing.Count > 0 ? existing.Max(e => e.Position) + 1 : 0;
    }

    public static List<string> MergeStringsUnique(List<string> a, List<string> b)
    {
        var result = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var s in a) result.Add(s);
        foreach (var s in b) result.Add(s);
        return result.ToList();
    }

    private static void CollectDescendantBoxIds(
        Dictionary<Guid, BoxData> boxes,
        List<BoxEdgeData> edges,
        Guid parentId,
        HashSet<Guid> collected)
    {
        collected.Add(parentId);
        var children = edges.Where(e => e.ParentBoxId == parentId).Select(e => e.ChildBoxId);
        foreach (var childId in children)
        {
            if (!collected.Contains(childId) && boxes.ContainsKey(childId))
                CollectDescendantBoxIds(boxes, edges, childId, collected);
        }
    }
}
