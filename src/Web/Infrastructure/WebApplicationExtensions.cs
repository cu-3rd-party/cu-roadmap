using CuRoadmap.Web.Endpoints;
using CuRoadmap.Web.Infrastructure;

namespace CuRoadmap.Web.Infrastructure;

public static class WebApplicationExtensions
{
    public static WebApplication MapEndpoints(this WebApplication app)
    {
        var users = app.MapGroup("/api/Users").WithTags("Users");
        Users.Map(users);

        // CU Roadmap endpoints
        var health = app.MapGroup("/api/health").WithTags("Health");
        Health.Map(health);

        var v1 = app.MapGroup("/api/v1");

        var auth = v1.MapGroup("/auth").WithTags("Auth");
        Auth.Map(auth);

        var courses = v1.MapGroup("/courses").WithTags("Courses");
        Courses.Map(courses);

        var majors = v1.MapGroup("/majors").WithTags("Majors");
        Majors.Map(majors);

        var graph = v1.MapGroup("/graph").WithTags("Graph");
        Graph.Map(graph);

        var planner = v1.MapGroup("/planner").WithTags("Planner");
        Planner.Map(planner);

        return app;
    }
}
