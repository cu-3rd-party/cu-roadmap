using Cu.Roadmap.Api.V1;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;

namespace CuRoadmapBackend.Services;

public sealed class CoursesGrpcService(ILogger<CoursesGrpcService> logger) : CoursesService.CoursesServiceBase
{
    public override Task<ListCoursesResponse> ListCourses(ListCoursesRequest request, ServerCallContext context)
    {
        logger.LogInformation("ListCourses called with {CohortCount} cohort filters", request.CohortYear.Count);
        return Task.FromResult(new ListCoursesResponse { Courses = { CreateDebugCourse("course-debug-list") } });
    }

    public override Task<ListCoursesResponse> ListCoursesByCohort(ListCoursesByCohortRequest request, ServerCallContext context)
    {
        logger.LogInformation("ListCoursesByCohort called for cohort {CohortYear}", request.CohortYear);

        var course = CreateDebugCourse($"course-debug-cohort-{request.CohortYear}");
        course.Title = $"Debug Course for Cohort {request.CohortYear}";
        course.AllowedCohorts.Clear();
        course.AllowedCohorts.Add(request.CohortYear);

        return Task.FromResult(new ListCoursesResponse { Courses = { course } });
    }

    public override Task<ResourceIdResponse> CreateCourse(CreateCourseRequest request, ServerCallContext context)
    {
        logger.LogInformation("CreateCourse called for {Title}", request.Title);

        return Task.FromResult(new ResourceIdResponse
        {
            Id = $"debug-created-course-{Slug(request.Title)}"
        });
    }

    public override Task<ResourceIdResponse> UpdateCourse(UpdateCourseRequest request, ServerCallContext context)
    {
        logger.LogInformation("UpdateCourse called for {Id}", request.Id);

        return Task.FromResult(new ResourceIdResponse
        {
            Id = string.IsNullOrWhiteSpace(request.Id) ? "debug-updated-course" : request.Id
        });
    }

    public override Task<StatusResponse> DeleteCourse(DeleteCourseRequest request, ServerCallContext context)
    {
        logger.LogInformation("DeleteCourse called for {Id}", request.Id);

        return Task.FromResult(new StatusResponse
        {
            Status = $"debug-deleted:{request.Id}"
        });
    }

    public override Task<BackupDataResponse> BackupData(Empty request, ServerCallContext context)
    {
        logger.LogInformation("BackupData called");

        return Task.FromResult(new BackupDataResponse
        {
            Status = "debug-backed-up",
            CoursesCount = 2,
            MajorsCount = 1
        });
    }

    public override Task<StatusResponse> RestoreData(Empty request, ServerCallContext context)
    {
        logger.LogInformation("RestoreData called");

        return Task.FromResult(new StatusResponse
        {
            Status = "debug-restored"
        });
    }

    private static Course CreateDebugCourse(string id)
    {
        var course = new Course
        {
            Id = id,
            Title = "Debug Course",
            Description = "Stub course returned by the .NET gRPC backend.",
            HandbookLink = "https://example.com/debug-course",
            CourseType = CourseType.Mandatory,
            Category = CourseCategory.Tech,
            RecommendedSemester = 1,
            Workload = 6
        };
        course.AvailableSemesters.AddRange([1, 2]);
        course.AllowedCohorts.AddRange([2025, 2026]);
        course.Prerequisites.Add("course-prereq-debug");
        course.Corequisites.Add("course-coreq-debug");
        course.Postrequisites.Add("course-postreq-debug");
        course.ToMajor.Add("major-debug-1", RequirementType.MajorCore);
        return course;
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