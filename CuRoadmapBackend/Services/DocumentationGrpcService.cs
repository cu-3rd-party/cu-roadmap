using Cu.Roadmap.Api.V1;
using Google.Protobuf.WellKnownTypes;
using Grpc.Core;

namespace CuRoadmapBackend.Services;

public sealed class DocumentationGrpcService(ILogger<DocumentationGrpcService> logger) : DocumentationService.DocumentationServiceBase
{
    public override Task<SwaggerUiResponse> GetSwaggerUi(Empty request, ServerCallContext context)
    {
        logger.LogInformation("GetSwaggerUi called");

        return Task.FromResult(new SwaggerUiResponse
        {
            Html = "<html><body><h1>Debug Swagger UI Stub</h1></body></html>"
        });
    }

    public override Task<OpenApiSpecResponse> GetOpenApiSpec(Empty request, ServerCallContext context)
    {
        logger.LogInformation("GetOpenApiSpec called");

        return Task.FromResult(new OpenApiSpecResponse
        {
            Yaml = "openapi: 3.1.0\ninfo:\n  title: Debug Stub\n  version: 0.0.0-debug\n"
        });
    }
}