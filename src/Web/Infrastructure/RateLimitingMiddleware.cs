using CuRoadmap.Application.Common.Interfaces;

namespace CuRoadmap.Web.Infrastructure;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private const int ReadCapacity = 20;
    private const double ReadRefill = 10;
    private const int MutateCapacity = 20;
    private const double MutateRefill = 5;

    public RateLimitingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ICacheService cache)
    {
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";
        var method = context.Request.Method;
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var key = $"{ip}:{method}:{path}";

        var isMutate = method is "POST" or "PUT" or "DELETE" or "PATCH";
        var capacity = isMutate ? MutateCapacity : ReadCapacity;
        var refill = isMutate ? MutateRefill : ReadRefill;

        var (allowed, retryAfter) = await cache.CheckRateLimitAsync(key, capacity, refill);
        if (!allowed)
        {
            context.Response.StatusCode = 429;
            context.Response.Headers.RetryAfter = retryAfter.ToString("F0");
            await context.Response.WriteAsync("Rate limit exceeded");
            return;
        }

        await _next(context);
    }
}
