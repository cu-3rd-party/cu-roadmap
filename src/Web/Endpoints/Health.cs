using CuRoadmap.Infrastructure.Services;
using Microsoft.AspNetCore.Http.HttpResults;

namespace CuRoadmap.Web.Endpoints;

public class Health : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.MapGet("/", GetHealth).AllowAnonymous();
    }

    [EndpointSummary("Health check")]
    public static Ok<object> GetHealth()
    {
        return TypedResults.Ok<object>(new { status = "ok" });
    }
}
