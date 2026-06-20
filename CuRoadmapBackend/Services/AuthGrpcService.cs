using Cu.Roadmap.Api.V1;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;

namespace CuRoadmapBackend.Services;

public sealed class AuthGrpcService(ILogger<AuthGrpcService> logger) : AuthService.AuthServiceBase
{
    public override Task<Empty> Login(LoginRequest request, ServerCallContext context)
    {
        logger.LogInformation("Login called with password length {Length}", request.Password?.Length ?? 0);
        return Task.FromResult(new Empty());
    }

    public override Task<Empty> Check(Empty request, ServerCallContext context)
    {
        logger.LogInformation("Check called");
        return Task.FromResult(new Empty());
    }

    public override Task<Empty> Logout(Empty request, ServerCallContext context)
    {
        logger.LogInformation("Logout called");
        return Task.FromResult(new Empty());
    }
}