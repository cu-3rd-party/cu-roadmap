using CuRoadmap.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace CuRoadmap.Web.Endpoints;

public class Graph : IEndpointGroup
{
    public static void Map(RouteGroupBuilder group)
    {
        group.MapGet("/data", GetGraphData).AllowAnonymous();
    }

    [EndpointSummary("Get full course dependency graph")]
    public static async Task<Ok<object>> GetGraphData(
        IApplicationDbContext context,
        CancellationToken ct)
    {
        var courses = await context.Courses.AsNoTracking().ToListAsync(ct);
        var deps = await context.CourseDependencies.AsNoTracking().ToListAsync(ct);

        var nodes = courses.Select(c => new
        {
            id = c.Id.ToString(),
            title = c.Title,
            type = c.CourseType.ToString(),
            category = c.Category.ToString()
        }).ToList();

        var edges = deps.Select(d => new
        {
            from = d.CourseId.ToString(),
            to = d.RequiredCourseId.ToString(),
            type = d.DependencyType.ToString(),
            alternative_group = d.AlternativeGroup
        }).ToList();

        return TypedResults.Ok<object>(new { nodes, edges });
    }
}
