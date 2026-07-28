using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Application.Common.Models;
using CuRoadmap.Application.Requirements;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace CuRoadmap.Web.Endpoints;

public class Majors : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.MapGet("/", GetAllMajors).AllowAnonymous();
        group.MapGet("/{cohortYear:int}", GetMajorsByCohort).AllowAnonymous();
        group.MapGet("/specializations/{majorId:guid}", GetSpecializations).AllowAnonymous();
        group.MapPost("/identify", IdentifyMajors).AllowAnonymous();
        group.MapPost("/identify/{cohortYear:int}", IdentifyMajorsByCohort).AllowAnonymous();
        group.MapPost("/identify-specializations", IdentifySpecializations).AllowAnonymous();
        group.MapPost("/identify-specializations/{cohortYear:int}", IdentifySpecializationsByCohort).AllowAnonymous();
        group.MapPost("/", CreateMajor);
        group.MapPut("/{id:guid}", UpdateMajor);
    }

    [EndpointSummary("List all majors")]
    public static async Task<Ok<List<MajorData>>> GetAllMajors(
        IApplicationDbContext context,
        CancellationToken ct)
    {
        var majors = await context.GetAllMajorsAsync(ct);
        return TypedResults.Ok(majors.Values.ToList());
    }

    [EndpointSummary("List majors by cohort year")]
    public static async Task<Ok<List<MajorData>>> GetMajorsByCohort(
        int cohortYear,
        IApplicationDbContext context,
        CancellationToken ct)
    {
        var majors = await context.GetAllMajorsAsync(ct);
        var filtered = majors.Values.Where(m => m.CohortYear == cohortYear).ToList();
        return TypedResults.Ok(filtered);
    }

    [EndpointSummary("Get specializations for a major")]
    public static async Task<Results<Ok<List<SpecializationData>>, NotFound>> GetSpecializations(
        Guid majorId,
        IApplicationDbContext context,
        CancellationToken ct)
    {
        var major = await context.GetMajorByIdAsync(majorId, ct);
        if (major is null) return TypedResults.NotFound();

        var specs = await context.GetSpecializationsByMajorAsync(majorId, ct);
        return TypedResults.Ok(specs);
    }

    [EndpointSummary("Identify majors by passed courses")]
    public static async Task<Ok<List<object>>> IdentifyMajors(
        IdentifyRequest request,
        IApplicationDbContext context,
        RequirementResolver resolver,
        CancellationToken ct)
    {
        return await IdentifyMajorsInternalAsync(request.PassedCourseIds, null, context, resolver, ct);
    }

    [EndpointSummary("Identify majors by passed courses (cohort)")]
    public static async Task<Ok<List<object>>> IdentifyMajorsByCohort(
        int cohortYear,
        IdentifyRequest request,
        IApplicationDbContext context,
        RequirementResolver resolver,
        CancellationToken ct)
    {
        return await IdentifyMajorsInternalAsync(request.PassedCourseIds, cohortYear, context, resolver, ct);
    }

    [EndpointSummary("Identify specializations by passed courses")]
    public static async Task<Ok<List<object>>> IdentifySpecializations(
        IdentifyRequest request,
        IApplicationDbContext context,
        RequirementResolver resolver,
        CancellationToken ct)
    {
        return await IdentifySpecializationsInternalAsync(request.PassedCourseIds, null, context, resolver, ct);
    }

    [EndpointSummary("Identify specializations by passed courses (cohort)")]
    public static async Task<Ok<List<object>>> IdentifySpecializationsByCohort(
        int cohortYear,
        IdentifyRequest request,
        IApplicationDbContext context,
        RequirementResolver resolver,
        CancellationToken ct)
    {
        return await IdentifySpecializationsInternalAsync(request.PassedCourseIds, cohortYear, context, resolver, ct);
    }

    [EndpointSummary("Create a major")]
    public static async Task<Created<MajorData>> CreateMajor(
        CreateMajorRequest request,
        IApplicationDbContext context,
        RequirementMutator mutator,
        CancellationToken ct)
    {
        var entity = new Domain.Entities.Major
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            School = request.School
        };
        context.Add(entity);
        await context.SaveChangesAsync(ct);

        if (request.Requirements.Count > 0)
        {
            var flatReqs = request.Requirements.Select((r, i) => new FlatRequirementInput(
                Guid.NewGuid(), Guid.Parse(r.CourseId),
                Domain.Enums.RequirementType.MajorCore,
                Array.Empty<string>(), Array.Empty<string>())).ToList();
            await mutator.ReplaceFlatRequirementsAsync(entity.Id, flatReqs, ct);
        }

        var created = await context.GetMajorByIdAsync(entity.Id, ct)!;
        return TypedResults.Created($"/api/v1/majors/{entity.Id}", created);
    }

    [EndpointSummary("Update a major")]
    public static async Task<Results<Ok<MajorData>, NotFound>> UpdateMajor(
        Guid id,
        UpdateMajorRequest request,
        IApplicationDbContext context,
        RequirementMutator mutator,
        CancellationToken ct)
    {
        var existing = await context.Majors.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (existing is null) return TypedResults.NotFound();

        existing.Title = request.Title;
        existing.School = request.School;
        await context.SaveChangesAsync(ct);

        if (request.Requirements.Count > 0)
        {
            var flatReqs = request.Requirements.Select((r, i) => new FlatRequirementInput(
                Guid.NewGuid(), Guid.Parse(r.CourseId),
                Domain.Enums.RequirementType.MajorCore,
                Array.Empty<string>(), Array.Empty<string>())).ToList();
            await mutator.ReplaceFlatRequirementsAsync(id, flatReqs, ct);
        }

        var updated = await context.GetMajorByIdAsync(id, ct)!;
        return TypedResults.Ok(updated);
    }

    private static async Task<Ok<List<object>>> IdentifyMajorsInternalAsync(
        List<Guid> passedCourseIds,
        int? cohortYear,
        IApplicationDbContext context,
        RequirementResolver resolver,
        CancellationToken ct)
    {
        await resolver.LoadGraphAsync(ct);
        var majors = await context.GetAllMajorsAsync(ct);
        var passedSet = passedCourseIds.ToHashSet();

        var results = new List<object>();
        foreach (var (majorId, major) in majors)
        {
            if (cohortYear.HasValue && major.CohortYear != cohortYear.Value) continue;

            var requiredIds = await resolver.MajorCoreCourseIdsAsync(majorId, ct);
            if (requiredIds is null || requiredIds.Count == 0) continue;

            var passed = requiredIds.Intersect(passedSet).Count();
            var total = requiredIds.Count;
            var score = total > 0 ? (double)passed / total * 100 : 0;

            results.Add(new
            {
                major_id = majorId.ToString(),
                title = major.Title,
                score = Math.Round(score, 1),
                passed_courses = passed,
                total_courses = total
            });
        }

        return TypedResults.Ok(results.OrderByDescending(r => ((dynamic)r).score).Cast<object>().ToList());
    }

    private static async Task<Ok<List<object>>> IdentifySpecializationsInternalAsync(
        List<Guid> passedCourseIds,
        int? cohortYear,
        IApplicationDbContext context,
        RequirementResolver resolver,
        CancellationToken ct)
    {
        await resolver.LoadGraphAsync(ct);
        var majors = await context.GetAllMajorsAsync(ct);
        var passedSet = passedCourseIds.ToHashSet();

        var results = new List<object>();
        foreach (var (majorId, major) in majors)
        {
            if (cohortYear.HasValue && major.CohortYear != cohortYear.Value) continue;

            var specs = await context.GetSpecializationsByMajorAsync(majorId, ct);
            foreach (var spec in specs)
            {
                var specIds = await resolver.SpecializationCourseIdsAsync(spec, ct);
                if (specIds is null || specIds.Count == 0) continue;

                var passed = specIds.Intersect(passedSet).Count();
                var total = specIds.Count;
                var score = total > 0 ? (double)passed / total * 100 : 0;

                results.Add(new
                {
                    spec_id = spec.Id.ToString(),
                    title = spec.Title,
                    major = major.Title,
                    score = Math.Round(score, 1),
                    passed_courses = passed,
                    total_courses = total
                });
            }
        }

        return TypedResults.Ok(results.OrderByDescending(r => ((dynamic)r).score).Cast<object>().ToList());
    }
}

public record IdentifyRequest(List<Guid> PassedCourseIds);
