using CuRoadmap.Application.Common.Models;
using CuRoadmap.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CuRoadmap.Application.Common.Interfaces;

public static class ApplicationDbContextExtensions
{
    public static async Task<Dictionary<Guid, CourseData>> GetAllCoursesAsync(
        this IApplicationDbContext context, CancellationToken ct = default)
    {
        var courses = await context.Courses
            .Include(c => c.CourseDependencies)
            .AsNoTracking()
            .ToListAsync(ct);
        return courses.ToDictionary(c => c.Id, ToCourseData);
    }

    public static async Task<CourseData?> GetCourseByIdAsync(
        this IApplicationDbContext context, Guid courseId, CancellationToken ct = default)
    {
        var course = await context.Courses
            .Include(c => c.CourseDependencies)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == courseId, ct);
        return course is not null ? ToCourseData(course) : null;
    }

    public static async Task<List<CourseDependencyData>> GetCourseDependenciesAsync(
        this IApplicationDbContext context, CancellationToken ct = default)
    {
        var deps = await context.CourseDependencies.AsNoTracking().ToListAsync(ct);
        return deps.Select(d => new CourseDependencyData(d.Id, d.CourseId, d.RequiredCourseId, d.DependencyType, d.AlternativeGroup)).ToList();
    }

    public static async Task<Dictionary<Guid, MajorData>> GetAllMajorsAsync(
        this IApplicationDbContext context, CancellationToken ct = default)
    {
        var majors = await context.Majors.AsNoTracking().ToListAsync(ct);
        return majors.ToDictionary(m => m.Id, m => new MajorData(m.Id, m.Title, m.School, m.CohortYear, m.RequirementsBoxId));
    }

    public static async Task<MajorData?> GetMajorByIdAsync(
        this IApplicationDbContext context, Guid majorId, CancellationToken ct = default)
    {
        var major = await context.Majors.AsNoTracking().FirstOrDefaultAsync(m => m.Id == majorId, ct);
        return major is not null ? new MajorData(major.Id, major.Title, major.School, major.CohortYear, major.RequirementsBoxId) : null;
    }

    public static async Task<Dictionary<Guid, BoxData>> GetAllBoxesAsync(
        this IApplicationDbContext context, CancellationToken ct = default)
    {
        var boxes = await context.Boxes.AsNoTracking().ToListAsync(ct);
        return boxes.ToDictionary(b => b.Id, ToBoxData);
    }

    public static async Task<BoxData?> GetBoxByIdAsync(
        this IApplicationDbContext context, Guid boxId, CancellationToken ct = default)
    {
        var box = await context.Boxes.AsNoTracking().FirstOrDefaultAsync(b => b.Id == boxId, ct);
        return box is not null ? ToBoxData(box) : null;
    }

    public static async Task<BoxData> CreateBoxAsync(
        this IApplicationDbContext context, BoxData box, CancellationToken ct = default)
    {
        var entity = new Box
        {
            Id = box.Id == Guid.Empty ? Guid.NewGuid() : box.Id,
            Kind = box.Kind,
            Title = box.Title,
            CourseId = box.CourseId,
            LogicalOp = box.LogicalOp,
            RequiredCount = box.RequiredCount,
            RequirementType = box.RequirementType,
            Specializations = box.Specializations,
            MandatorySpecializations = box.MandatorySpecializations,
            AdmissionYear = box.AdmissionYear,
            MajorTrack = box.MajorTrack
        };
        context.Add(entity);
        await context.SaveChangesAsync(ct);
        return box with { Id = entity.Id };
    }

    public static async Task<BoxData> UpdateBoxAsync(
        this IApplicationDbContext context, BoxData box, CancellationToken ct = default)
    {
        var entity = await context.Boxes.FirstOrDefaultAsync(b => b.Id == box.Id, ct);
        if (entity is null) throw new InvalidOperationException($"Box {box.Id} not found");

        entity.Kind = box.Kind;
        entity.Title = box.Title;
        entity.CourseId = box.CourseId;
        entity.LogicalOp = box.LogicalOp;
        entity.RequiredCount = box.RequiredCount;
        entity.RequirementType = box.RequirementType;
        entity.Specializations = box.Specializations;
        entity.MandatorySpecializations = box.MandatorySpecializations;
        entity.AdmissionYear = box.AdmissionYear;
        entity.MajorTrack = box.MajorTrack;

        await context.SaveChangesAsync(ct);
        return box;
    }

    public static async Task DeleteBoxAsync(
        this IApplicationDbContext context, Guid boxId, CancellationToken ct = default)
    {
        var entity = await context.Boxes.FirstOrDefaultAsync(b => b.Id == boxId, ct);
        if (entity is not null)
        {
            context.Remove(entity);
            await context.SaveChangesAsync(ct);
        }
    }

    public static async Task<List<BoxEdgeData>> GetBoxEdgesAsync(
        this IApplicationDbContext context, CancellationToken ct = default)
    {
        var edges = await context.BoxEdges.AsNoTracking().ToListAsync(ct);
        return edges.Select(e => new BoxEdgeData(e.Id, e.ParentBoxId, e.ChildBoxId, e.Position)).ToList();
    }

    public static async Task<BoxEdgeData> CreateBoxEdgeAsync(
        this IApplicationDbContext context, BoxEdgeData edge, CancellationToken ct = default)
    {
        var entity = new BoxEdge
        {
            Id = edge.Id == Guid.Empty ? Guid.NewGuid() : edge.Id,
            ParentBoxId = edge.ParentBoxId,
            ChildBoxId = edge.ChildBoxId,
            Position = edge.Position
        };
        context.Add(entity);
        await context.SaveChangesAsync(ct);
        return edge with { Id = entity.Id };
    }

    public static async Task DeleteBoxEdgesByParentAsync(
        this IApplicationDbContext context, Guid parentBoxId, CancellationToken ct = default)
    {
        var edges = await context.BoxEdges.Where(e => e.ParentBoxId == parentBoxId).ToListAsync(ct);
        foreach (var e in edges) context.Remove(e);
        await context.SaveChangesAsync(ct);
    }

    public static async Task DeleteBoxEdgesByChildAsync(
        this IApplicationDbContext context, Guid childBoxId, CancellationToken ct = default)
    {
        var edges = await context.BoxEdges.Where(e => e.ChildBoxId == childBoxId).ToListAsync(ct);
        foreach (var e in edges) context.Remove(e);
        await context.SaveChangesAsync(ct);
    }

    public static async Task<List<SpecializationData>> GetSpecializationsByMajorAsync(
        this IApplicationDbContext context, Guid majorId, CancellationToken ct = default)
    {
        var specs = await context.Specializations
            .AsNoTracking()
            .Where(s => s.MajorId == majorId)
            .ToListAsync(ct);
        return specs.Select(s => new SpecializationData(s.Id, s.MajorId, s.Title, s.RequirementsBoxId)).ToList();
    }

    public static async Task<SpecializationData> CreateSpecializationAsync(
        this IApplicationDbContext context, SpecializationData spec, CancellationToken ct = default)
    {
        var entity = new Specialization
        {
            Id = spec.Id == Guid.Empty ? Guid.NewGuid() : spec.Id,
            MajorId = spec.MajorId,
            Title = spec.Title,
            RequirementsBoxId = spec.RequirementsBoxId
        };
        context.Add(entity);
        await context.SaveChangesAsync(ct);
        return spec with { Id = entity.Id };
    }

    public static async Task DeleteSpecializationsAsync(
        this IApplicationDbContext context, Guid majorId, CancellationToken ct = default)
    {
        var specs = await context.Specializations.Where(s => s.MajorId == majorId).ToListAsync(ct);
        foreach (var s in specs) context.Remove(s);
        await context.SaveChangesAsync(ct);
    }

    public static async Task<CourseDependencyData> CreateCourseDependencyAsync(
        this IApplicationDbContext context, CourseDependencyData dep, CancellationToken ct = default)
    {
        var entity = new CourseDependency
        {
            Id = dep.Id == Guid.Empty ? Guid.NewGuid() : dep.Id,
            CourseId = dep.CourseId,
            RequiredCourseId = dep.RequiredCourseId,
            DependencyType = dep.DependencyType,
            AlternativeGroup = dep.AlternativeGroup
        };
        context.Add(entity);
        await context.SaveChangesAsync(ct);
        return dep with { Id = entity.Id };
    }

    public static async Task DeleteCourseDependenciesAsync(
        this IApplicationDbContext context, Guid courseId, CancellationToken ct = default)
    {
        var deps = await context.CourseDependencies.Where(d => d.CourseId == courseId).ToListAsync(ct);
        foreach (var d in deps) context.Remove(d);
        await context.SaveChangesAsync(ct);
    }

    public static async Task ClearAllAsync(
        this IApplicationDbContext context, CancellationToken ct = default)
    {
        foreach (var e in context.CourseDependencies) context.Remove(e);
        foreach (var e in context.BoxEdges) context.Remove(e);
        foreach (var e in context.Boxes) context.Remove(e);
        foreach (var e in context.Specializations) context.Remove(e);
        foreach (var e in context.Courses) context.Remove(e);
        foreach (var e in context.Majors) context.Remove(e);
        foreach (var e in context.Students) context.Remove(e);
        await context.SaveChangesAsync(ct);
    }

    private static CourseData ToCourseData(Course c)
    {
        var prereqs = new List<Guid>();
        var coreqs = new List<Guid>();
        var postreqs = new List<Guid>();

        foreach (var dep in c.CourseDependencies)
        {
            if (dep.DependencyType == Domain.Enums.DependencyType.Prerequisite && dep.CourseId == c.Id)
                prereqs.Add(dep.RequiredCourseId);
            else if (dep.DependencyType == Domain.Enums.DependencyType.Corequisite && dep.CourseId == c.Id)
                coreqs.Add(dep.RequiredCourseId);
            else if (dep.DependencyType == Domain.Enums.DependencyType.Prerequisite && dep.RequiredCourseId == c.Id)
                postreqs.Add(dep.CourseId);
        }

        return new CourseData(
            c.Id, c.Title, c.Description, c.HandbookLink,
            c.CourseType, c.Category,
            c.AllowedCohorts, c.AvailableSemesters,
            c.RecommendedSemester, c.Workload,
            c.SeminarsWeek, c.LecturesWeek,
            c.AnalogGroup, c.CsatMetric,
            prereqs, coreqs, postreqs);
    }

    private static BoxData ToBoxData(Box b) => new(
        b.Id, b.Kind, b.Title, b.CourseId, b.LogicalOp,
        b.RequiredCount, b.RequirementType,
        b.Specializations, b.MandatorySpecializations,
        b.AdmissionYear, b.MajorTrack);
}
