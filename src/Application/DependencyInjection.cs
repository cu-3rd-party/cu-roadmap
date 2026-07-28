using System.Reflection;
using CuRoadmap.Application.Planner;
using CuRoadmap.Application.Requirements;
using FluentValidation;
using Microsoft.Extensions.Hosting;

namespace Microsoft.Extensions.DependencyInjection;

public static class DependencyInjection
{
    public static void AddApplicationServices(this IHostApplicationBuilder builder)
    {
        builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        // Requirements engine
        builder.Services.AddScoped<RequirementResolver>();
        builder.Services.AddScoped<RequirementMutator>();

        // Planner
        builder.Services.AddScoped<RoadmapValidator>();
    }
}
