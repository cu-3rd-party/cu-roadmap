using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace CuRoadmap.Web.Infrastructure;

public class MetricsMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly Counter<int> RequestCounter = Diagnostics.Meter.CreateCounter<int>("http_requests_total", "Total HTTP requests");
    private static readonly Histogram<double> RequestDuration = Diagnostics.Meter.CreateHistogram<double>("http_request_duration_seconds", "HTTP request duration");
    private static readonly Counter<int> RequestErrors = Diagnostics.Meter.CreateCounter<int>("http_request_errors_total", "Total HTTP request errors");

    public MetricsMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            await _next(context);
        }
        catch
        {
            RequestErrors.Add(1, new KeyValuePair<string, object?>("method", context.Request.Method));
            throw;
        }
        finally
        {
            sw.Stop();
            RequestCounter.Add(1, new KeyValuePair<string, object?>("method", context.Request.Method),
                new KeyValuePair<string, object?>("path", context.Request.Path),
                new KeyValuePair<string, object?>("status", context.Response.StatusCode));
            RequestDuration.Record(sw.Elapsed.TotalSeconds,
                new KeyValuePair<string, object?>("method", context.Request.Method),
                new KeyValuePair<string, object?>("path", context.Request.Path));
        }
    }
}

public static class Diagnostics
{
    public static readonly Meter Meter = new("CuRoadmap.Web", "1.0.0");
}
