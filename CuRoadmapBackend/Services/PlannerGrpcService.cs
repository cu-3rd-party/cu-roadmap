using Cu.Roadmap.Api.V1;
using Grpc.Core;

namespace CuRoadmapBackend.Services;

public sealed class PlannerGrpcService(ILogger<PlannerGrpcService> logger) : PlannerService.PlannerServiceBase
{
    public override Task<GenerateRoadmapResponse> GenerateRoadmap(GenerateRoadmapRequest request, ServerCallContext context)
    {
        logger.LogInformation("GenerateRoadmap called for major {MajorId}", request.MajorId);

        var response = new GenerateRoadmapResponse
        {
            MajorId = string.IsNullOrWhiteSpace(request.MajorId) ? "major-debug-2025" : request.MajorId
        };
        response.Roadmap.Add(CreateRoadmapSemester(1, ["course-debug-list"], 6, status: "debug-generated"));
        response.Roadmap.Add(CreateRoadmapSemester(2, ["course-debug-cohort"], 5));
        return Task.FromResult(response);
    }

    public override Task<SemesterValidationResponse> ValidateSemester(ValidateSemesterRequest request, ServerCallContext context)
    {
        logger.LogInformation("ValidateSemester called for semester {Semester}", request.CurrentSemester);

        var response = new SemesterValidationResponse
        {
            IsValid = true,
            TotalLoad = request.CourseIds.Count * 3
        };
        response.Messages.Add(new ValidationMessage
        {
            Level = ValidationLevel.Warning,
            Message = "Debug stub validation only. No business rules are applied.",
            CourseId = request.CourseIds.FirstOrDefault() ?? string.Empty
        });
        return Task.FromResult(response);
    }

    public override Task<RoadmapValidationResponse> ValidateRoadmap(ValidateRoadmapRequest request, ServerCallContext context)
    {
        logger.LogInformation("ValidateRoadmap called with {SemesterCount} semesters", request.Roadmap.Count);

        var response = new RoadmapValidationResponse();
        foreach (var semester in request.Roadmap)
        {
            var result = new RoadmapValidationResult
            {
                Semester = semester.Semester,
                Valid = true,
                TotalLoad = semester.CourseIds.Count * 3
            };
            result.Messages.Add(new ValidationMessage
            {
                Level = ValidationLevel.Warning,
                Message = $"Debug stub validation for semester {semester.Semester}."
            });
            response.ValidationResults.Add(result);
        }

        if (response.ValidationResults.Count == 0)
        {
            response.ValidationResults.Add(new RoadmapValidationResult
            {
                Semester = request.CurrentSemester,
                Valid = true,
                TotalLoad = 0
            });
        }

        return Task.FromResult(response);
    }

    public override Task<GetGoalPathResponse> GetGoalPath(GetGoalPathRequest request, ServerCallContext context)
    {
        logger.LogInformation("GetGoalPath called for target course {TargetCourseId}", request.TargetCourseId);

        var response = new GetGoalPathResponse();
        response.Roadmap.Add(CreateRoadmapSemester(request.CurrentSemester == 0 ? 1 : request.CurrentSemester, [request.TargetCourseId], 4, status: "debug-goal-path"));
        return Task.FromResult(response);
    }

    private static RoadmapSemester CreateRoadmapSemester(int semester, IEnumerable<string> courseIds, double totalLoad, string? status = null)
    {
        var roadmapSemester = new RoadmapSemester
        {
            Semester = semester,
            TotalLoad = totalLoad
        };

        if (!string.IsNullOrWhiteSpace(status))
        {
            roadmapSemester.Status = status;
        }

        roadmapSemester.CourseIds.AddRange(courseIds.Where(static id => !string.IsNullOrWhiteSpace(id)));
        return roadmapSemester;
    }
}