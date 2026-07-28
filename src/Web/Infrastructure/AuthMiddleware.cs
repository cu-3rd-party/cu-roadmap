using CuRoadmap.Application.Common.Interfaces;

namespace CuRoadmap.Web.Infrastructure;

public class AuthMiddleware
{
    private readonly RequestDelegate _next;

    public AuthMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ICacheService cache)
    {
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

        if (path.StartsWith("/api/health") ||
            path.StartsWith("/api/v1/auth/login") ||
            path == "/api/v1/graph/data" ||
            (path.StartsWith("/api/v1/majors") && context.Request.Method == "GET") ||
            (path.StartsWith("/api/v1/courses") && context.Request.Method == "GET") ||
            path.StartsWith("/api/v1/planner"))
        {
            await _next(context);
            return;
        }

        var tokenStr = context.Request.Cookies["auth-token"];
        if (!string.IsNullOrEmpty(tokenStr) && Guid.TryParse(tokenStr, out var token))
        {
            var valid = await cache.CheckAuthTokenAsync(token);
            if (valid)
            {
                await _next(context);
                return;
            }
        }

        context.Response.StatusCode = 401;
        await context.Response.WriteAsync("Unauthorized");
    }
}
