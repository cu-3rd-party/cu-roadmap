using Cu.Roadmap.Api.V1;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;

namespace CuRoadmapBackend.Services;

public sealed class GraphGrpcService(ILogger<GraphGrpcService> logger) : GraphService.GraphServiceBase
{
    public override Task<GraphDataResponse> GetGraphData(Empty request, ServerCallContext context)
    {
        logger.LogInformation("GetGraphData called");

        var response = new GraphDataResponse();
        response.Nodes.Add(new GraphNode
        {
            Id = "course-debug-1",
            Label = "Debug Fundamentals",
            Group = CourseCategory.Fundamentals,
            Description = "Stub node returned by CuRoadmapBackend.",
            RecommendedSemester = 1
        });
        response.Nodes.Add(new GraphNode
        {
            Id = "course-debug-2",
            Label = "Debug AI",
            Group = CourseCategory.Ai,
            Description = "Second stub node.",
            RecommendedSemester = 2
        });
        response.Edges.Add(new GraphEdge
        {
            From = "course-debug-1",
            To = "course-debug-2",
            Label = DependencyType.Prerequisite
        });

        return Task.FromResult(response);
    }
}