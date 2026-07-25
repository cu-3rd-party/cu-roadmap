using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace CuRoadmap.Application.FunctionalTests.Infrastructure;

public class WebApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Use a test connection string. Override via env variable or appsettings.Test.json.
        builder.UseSetting("ConnectionStrings:CuRoadmapDb",
            Environment.GetEnvironmentVariable("TEST_CONNECTION_STRING")
            ?? "Host=localhost;Database=CuRoadmapTest;Username=postgres;Password=postgres");
    }
}
