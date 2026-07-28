using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Application.Common.Models;
using CuRoadmap.Application.Planner;
using CuRoadmap.Application.Requirements;
using CuRoadmap.Domain.Enums;
using Microsoft.AspNetCore.Http.HttpResults;

namespace CuRoadmap.Web.Endpoints;

public class Planner : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.MapPost("/generate", GenerateRoadmap).AllowAnonymous();
        group.MapPost("/validate-semester", ValidateSemester).AllowAnonymous();
        group.MapPost("/validate-roadmap", ValidateRoadmap).AllowAnonymous();
        group.MapPost("/goal-path", FindGoalPath).AllowAnonymous();
    }

    [EndpointSummary("Generate roadmap")]
    public static async Task<Ok<object>> GenerateRoadmap(
        PlannerRequest request,
        IApplicationDbContext context)
    {
        var plannerKind = request.CourseSource switch
        {
            CourseSource.Selected => PlannerKind.DynamicProgramming,
            CourseSource.Passed => PlannerKind.Greedy,
            _ => PlannerKind.DynamicProgramming
        };

        var planner = RoadmapPlannerFactory.Create(plannerKind, context);
        var result = await planner.GenerateRoadmapAsync(
            request.PassedCourseIds,
            request.SelectedCourseIds,
            request.MajorId,
            request.SpecializationId,
            request.CurrentSemester,
            request.MaxLoad,
            request.Cohort);
        return TypedResults.Ok(result);
    }

    [EndpointSummary("Validate a single semester")]
    public static async Task<Ok<ValidationResult>> ValidateSemester(
        SemesterValidationRequest request,
        RoadmapValidator validator,
        CancellationToken ct)
    {
        await validator.LoadDataAsync(ct);
        var result = await validator.ValidateSemesterAsync(
            request.CourseIds,
            request.PassedCourseIds.ToHashSet(),
            request.CurrentSemester,
            request.MaxLoad,
            ct);
        return TypedResults.Ok(result);
    }

    [EndpointSummary("Validate full roadmap")]
    public static async Task<Ok<List<Dictionary<string, object>>>> ValidateRoadmap(
        RoadmapValidationRequest request,
        IApplicationDbContext context,
        RoadmapValidator validator,
        RequirementResolver resolver,
        CancellationToken ct)
    {
        await validator.LoadDataAsync(ct);

        HashSet<Guid> requiredCourseIds = [];
        if (request.MajorId.HasValue)
        {
            var majors = await context.GetAllMajorsAsync(ct);
            if (majors.TryGetValue(request.MajorId.Value, out var major))
            {
                var ids = await resolver.MajorCoreCourseIdsAsync(request.MajorId.Value, ct);
                if (ids is not null) requiredCourseIds = ids.ToHashSet();

                if (request.SpecializationId.HasValue)
                {
                    var specs = await context.GetSpecializationsByMajorAsync(request.MajorId.Value, ct);
                    var spec = specs.FirstOrDefault(s => s.Id == request.SpecializationId.Value);
                    if (spec is not null && spec.RequirementsBoxId is not null)
                    {
                        var specIds = await resolver.SpecializationCourseIdsAsync(spec, ct);
                        if (specIds is not null)
                            requiredCourseIds.UnionWith(specIds);
                    }
                }
            }
        }

        var result = await validator.ValidateFullRoadmapAsync(
            request.Roadmap,
            new HashSet<Guid>(),
            request.MaxLoad,
            requiredCourseIds,
            ct);
        return TypedResults.Ok(result);
    }

    [EndpointSummary("Find path to a target course")]
    public static async Task<Ok<List<Dictionary<string, object>>>> FindGoalPath(
        GoalPathRequest request,
        IApplicationDbContext context)
    {
        var service = new PlannerService(context);
        var result = await service.FindPathToCourseAsync(
            request.TargetCourseId,
            request.PassedCourseIds.ToHashSet(),
            request.CurrentSemester,
            request.MaxLoad,
            request.GoalSemester);
        return TypedResults.Ok(result);
    }
}
