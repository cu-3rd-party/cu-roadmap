using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Application.Common.Models;
using CuRoadmap.Application.Requirements;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace CuRoadmap.Web.Endpoints;

public class Courses : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.MapGet("/", GetCourses).AllowAnonymous();
        group.MapGet("/{cohortYear:int}/{majorId:guid}", GetCoursesForMajor).AllowAnonymous();
        group.MapGet("/backup", BackupCourses);
        group.MapPost("/restore", RestoreCourses);
        group.MapPost("/", CreateCourse);
        group.MapPut("/{id:guid}", UpdateCourse);
        group.MapDelete("/{id:guid}", DeleteCourse);
    }

    [EndpointSummary("List courses")]
    public static async Task<Ok<List<CourseData>>> GetCourses(
        [AsParameters] CourseFilter filter,
        IApplicationDbContext context,
        CancellationToken ct)
    {
        var query = context.Courses
            .Include(c => c.CourseDependencies)
            .AsNoTracking();

        var courses = await query.ToListAsync(ct);
        var result = courses.Select(ToCourseData).ToList();

        if (filter.CohortYears.Length > 0)
        {
            result = result.Where(c => c.AllowedCohorts.Length == 0 || c.AllowedCohorts.Any(y => filter.CohortYears.Contains(y))).ToList();
        }
        if (!string.IsNullOrEmpty(filter.Title))
        {
            result = result.Where(c => c.Title.Contains(filter.Title, StringComparison.OrdinalIgnoreCase)).ToList();
        }
        if (filter.CourseTypes.Length > 0)
        {
            result = result.Where(c => filter.CourseTypes.Contains(c.CourseType)).ToList();
        }
        if (filter.Categories.Length > 0)
        {
            result = result.Where(c => filter.Categories.Contains(c.Category)).ToList();
        }
        if (!string.IsNullOrEmpty(filter.WorkloadOp))
        {
            result = filter.WorkloadOp switch
            {
                "<" => result.Where(c => c.Workload < filter.WorkloadVal).ToList(),
                "=" => result.Where(c => Math.Abs(c.Workload - filter.WorkloadVal) < 0.01).ToList(),
                ">" => result.Where(c => c.Workload > filter.WorkloadVal).ToList(),
                _ => result
            };
        }

        return TypedResults.Ok(result);
    }

    [EndpointSummary("List courses for a major")]
    public static async Task<Results<Ok<List<CourseData>>, NotFound>> GetCoursesForMajor(
        int cohortYear,
        Guid majorId,
        IApplicationDbContext context,
        RequirementResolver resolver,
        CancellationToken ct)
    {
        await resolver.LoadGraphAsync(ct);

        var major = await context.GetMajorByIdAsync(majorId, ct);
        if (major is null) return TypedResults.NotFound();

        var courseIds = await resolver.MajorCoreCourseIdsAsync(majorId, ct);
        if (courseIds is null || courseIds.Count == 0) return TypedResults.NotFound();

        var courses = new List<CourseData>();
        foreach (var id in courseIds)
        {
            var c = await context.GetCourseByIdAsync(id, ct);
            if (c is not null) courses.Add(c);
        }

        return TypedResults.Ok(courses);
    }

    [EndpointSummary("Backup courses to JSON")]
    public static async Task<Ok<object>> BackupCourses(
        IApplicationDbContext context,
        CancellationToken ct)
    {
        var courses = await context.GetAllCoursesAsync(ct);
        return TypedResults.Ok<object>(new { courses = courses.Values.ToList() });
    }

    [EndpointSummary("Restore courses from JSON")]
    public static async Task<Ok<object>> RestoreCourses(
        List<CourseData> courses,
        IApplicationDbContext context,
        CancellationToken ct)
    {
        await context.ClearAllAsync(ct);

        foreach (var c in courses)
        {
            var entity = new Domain.Entities.Course
            {
                Id = c.Id == Guid.Empty ? Guid.NewGuid() : c.Id,
                Title = c.Title,
                Description = c.Description,
                HandbookLink = c.HandbookLink,
                CourseType = c.CourseType,
                Category = c.Category,
                AllowedCohorts = c.AllowedCohorts,
                AvailableSemesters = c.AvailableSemesters,
                RecommendedSemester = c.RecommendedSemester,
                Workload = c.Workload,
                SeminarsWeek = c.SeminarsWeek,
                LecturesWeek = c.LecturesWeek,
                AnalogGroup = c.AnalogGroup,
                CsatMetric = c.CsatMetric
            };
            context.Add(entity);
        }

        await context.SaveChangesAsync(ct);
        return TypedResults.Ok<object>(new { restored = courses.Count });
    }

    [EndpointSummary("Create a course")]
    public static async Task<Created<CourseData>> CreateCourse(
        CreateCourseRequest request,
        IApplicationDbContext context,
        RequirementMutator mutator,
        CancellationToken ct)
    {
        var entity = new Domain.Entities.Course
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            HandbookLink = request.HandbookLink,
            CourseType = request.CourseType,
            Category = request.Category,
            AllowedCohorts = request.AllowedCohorts,
            AvailableSemesters = request.AvailableSemesters,
            RecommendedSemester = request.RecommendedSemester,
            Workload = request.Workload,
            SeminarsWeek = request.SeminarsWeek,
            LecturesWeek = request.LecturesWeek
        };
        context.Add(entity);
        await context.SaveChangesAsync(ct);

        var course = await context.GetCourseByIdAsync(entity.Id, ct)!;

        if (request.Prerequisites.Count > 0 || request.Corequisites.Count > 0)
        {
            var flatReqs = new List<FlatRequirementInput>();
            foreach (var prereq in request.Prerequisites)
            {
                flatReqs.Add(new FlatRequirementInput(
                    Guid.NewGuid(), entity.Id,
                    Domain.Enums.RequirementType.MajorCore,
                    [prereq], Array.Empty<string>()));
            }
            foreach (var coreq in request.Corequisites)
            {
                flatReqs.Add(new FlatRequirementInput(
                    Guid.NewGuid(), entity.Id,
                    Domain.Enums.RequirementType.MajorCore,
                    Array.Empty<string>(), [coreq]));
            }
            await mutator.ReplaceFlatRequirementsAsync(entity.Id, flatReqs, ct);
        }

        return TypedResults.Created($"/api/v1/courses/{entity.Id}", course);
    }

    [EndpointSummary("Update a course")]
    public static async Task<Results<Ok<CourseData>, NotFound>> UpdateCourse(
        Guid id,
        UpdateCourseRequest request,
        IApplicationDbContext context,
        RequirementMutator mutator,
        CancellationToken ct)
    {
        var existing = await context.Courses.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (existing is null) return TypedResults.NotFound();

        existing.Title = request.Title;
        existing.Description = request.Description;
        existing.HandbookLink = request.HandbookLink;
        existing.CourseType = request.CourseType;
        existing.Category = request.Category;
        existing.AllowedCohorts = request.AllowedCohorts;
        existing.AvailableSemesters = request.AvailableSemesters;
        existing.RecommendedSemester = request.RecommendedSemester;
        existing.Workload = request.Workload;
        existing.SeminarsWeek = request.SeminarsWeek;
        existing.LecturesWeek = request.LecturesWeek;

        await context.SaveChangesAsync(ct);

        var updated = await context.GetCourseByIdAsync(id, ct)!;

        if (request.Prerequisites.Count > 0 || request.Corequisites.Count > 0)
        {
            var flatReqs = new List<FlatRequirementInput>();
            foreach (var prereq in request.Prerequisites)
            {
                flatReqs.Add(new FlatRequirementInput(
                    Guid.NewGuid(), id,
                    Domain.Enums.RequirementType.MajorCore,
                    [prereq], Array.Empty<string>()));
            }
            foreach (var coreq in request.Corequisites)
            {
                flatReqs.Add(new FlatRequirementInput(
                    Guid.NewGuid(), id,
                    Domain.Enums.RequirementType.MajorCore,
                    Array.Empty<string>(), [coreq]));
            }
            await mutator.ReplaceFlatRequirementsAsync(id, flatReqs, ct);
        }

        return TypedResults.Ok(updated);
    }

    [EndpointSummary("Delete a course")]
    public static async Task<NoContent> DeleteCourse(
        Guid id,
        IApplicationDbContext context,
        CancellationToken ct)
    {
        var entity = await context.Courses.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (entity is not null)
        {
            context.Remove(entity);
            await context.SaveChangesAsync(ct);
        }
        return TypedResults.NoContent();
    }

    private static CourseData ToCourseData(Domain.Entities.Course c)
    {
        var prereqs = new List<Guid>();
        var coreqs = new List<Guid>();

        foreach (var dep in c.CourseDependencies)
        {
            if (dep.DependencyType == Domain.Enums.DependencyType.Prerequisite && dep.CourseId == c.Id)
                prereqs.Add(dep.RequiredCourseId);
            else if (dep.DependencyType == Domain.Enums.DependencyType.Corequisite && dep.CourseId == c.Id)
                coreqs.Add(dep.RequiredCourseId);
        }

        return new CourseData(
            c.Id, c.Title, c.Description, c.HandbookLink,
            c.CourseType, c.Category,
            c.AllowedCohorts, c.AvailableSemesters,
            c.RecommendedSemester, c.Workload,
            c.SeminarsWeek, c.LecturesWeek,
            c.AnalogGroup, c.CsatMetric,
            prereqs, coreqs, new List<Guid>());
    }
}
