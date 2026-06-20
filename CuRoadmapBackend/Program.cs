using CuRoadmapBackend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddGrpc();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.MapGrpcService<SystemGrpcService>();
app.MapGrpcService<DocumentationGrpcService>();
app.MapGrpcService<GraphGrpcService>();
app.MapGrpcService<CoursesGrpcService>();
app.MapGrpcService<MajorsGrpcService>();
app.MapGrpcService<PlannerGrpcService>();
app.MapGrpcService<AuthGrpcService>();
app.MapGet("/", () => "CuRoadmapBackend is running with debug gRPC stubs. Use a gRPC client to call the API services.");

app.Run();
