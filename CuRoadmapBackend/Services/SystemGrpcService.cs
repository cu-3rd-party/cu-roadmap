using Cu.Roadmap.Api.V1;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;

namespace CuRoadmapBackend.Services;

public sealed class SystemGrpcService(ILogger<SystemGrpcService> logger) : SystemService.SystemServiceBase
{
    public override Task<HealthResponse> GetHealth(Empty request, ServerCallContext context)
    {
        logger.LogInformation("GetHealth called");

        return Task.FromResult(new HealthResponse
        {
            Status = "debug-stub",
            Timestamp = Timestamp.FromDateTime(DateTime.UtcNow)
        });
    }
}