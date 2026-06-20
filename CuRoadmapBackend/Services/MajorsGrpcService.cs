using Cu.Roadmap.Api.V1;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;

namespace CuRoadmapBackend.Services;

public sealed class MajorsGrpcService(ILogger<MajorsGrpcService> logger) : MajorsService.MajorsServiceBase
{
    public override Task<ListMajorsResponse> ListMajors(Empty request, ServerCallContext context)
    {
        logger.LogInformation("ListMajors called");
        return Task.FromResult(new ListMajorsResponse { Majors = { CreateDebugMajor(2025) } });
    }

    public override Task<ListMajorsResponse> ListMajorsByCohort(ListMajorsByCohortRequest request, ServerCallContext context)
    {
        logger.LogInformation("ListMajorsByCohort called for cohort {CohortYear}", request.CohortYear);
        return Task.FromResult(new ListMajorsResponse { Majors = { CreateDebugMajor(request.CohortYear) } });
    }

    public override Task<IdentifyMajorsResponse> IdentifyMajors(IdentifyMajorsRequest request, ServerCallContext context)
    {
        logger.LogInformation("IdentifyMajors called with {PassedCount} passed courses", request.PassedCourseIds.Count);
        return Task.FromResult(CreateIdentifyResponse(request.PassedCourseIds.Count, 2025));
    }

    public override Task<IdentifyMajorsResponse> IdentifyMajorsByCohort(IdentifyMajorsByCohortRequest request, ServerCallContext context)
    {
        logger.LogInformation("IdentifyMajorsByCohort called for cohort {CohortYear}", request.CohortYear);
        return Task.FromResult(CreateIdentifyResponse(request.PassedCourseIds.Count, request.CohortYear));
    }

    public override Task<ResourceIdResponse> CreateMajor(CreateMajorRequest request, ServerCallContext context)
    {
        logger.LogInformation("CreateMajor called for {Title}", request.Title);

        return Task.FromResult(new ResourceIdResponse
        {
            Id = $"debug-created-major-{Slug(request.Title)}"
        });
    }

    public override Task<ResourceIdResponse> UpdateMajor(UpdateMajorRequest request, ServerCallContext context)
    {
        logger.LogInformation("UpdateMajor called for {Id}", request.Id);

        return Task.FromResult(new ResourceIdResponse
        {
            Id = string.IsNullOrWhiteSpace(request.Id) ? "debug-updated-major" : request.Id
        });
    }

    private static Major CreateDebugMajor(int cohortYear)
    {
        var major = new Major
        {
            Id = $"major-debug-{cohortYear}",
            Title = $"Debug Major {cohortYear}",
            School = "Debug School",
            CohortYear = cohortYear
        };
        major.Requirements.Add(new MajorRequirement
        {
            CourseId = "course-debug-list",
            Type = RequirementType.MajorCore
        });
        return major;
    }

    private static IdentifyMajorsResponse CreateIdentifyResponse(int passedCount, int cohortYear)
    {
        var response = new IdentifyMajorsResponse();
        response.Matches.Add(new MajorMatchResult
        {
            Id = $"major-debug-{cohortYear}",
            Title = $"Debug Major {cohortYear}",
            CohortYear = cohortYear,
            Score = 0.5,
            CoveredCount = passedCount,
            CanCoverCount = 3,
            TotalCount = Math.Max(4, passedCount + 1)
        });
        return response;
    }

    private static string Slug(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "unnamed";
        }

        return value.Trim().ToLowerInvariant().Replace(' ', '-');
    }
}