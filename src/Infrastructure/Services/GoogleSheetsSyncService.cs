using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Domain.Entities;
using CuRoadmap.Domain.Enums;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Google.Apis.Sheets.v4;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CuRoadmap.Infrastructure.Services;

public class GoogleSheetsSyncService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GoogleSheetsSyncService> _logger;
    private readonly TimeSpan _syncInterval;

    public GoogleSheetsSyncService(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ILogger<GoogleSheetsSyncService> logger)
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _logger = logger;
        _syncInterval = TimeSpan.FromMinutes(
            configuration.GetValue("GoogleSheets:SyncIntervalMinutes", 10));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Google Sheets sync service started");

        // Sync immediately on startup, then on interval
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Google Sheets sync failed");
            }

            await Task.Delay(_syncInterval, stoppingToken);
        }
    }

    private async Task SyncAsync(CancellationToken ct)
    {
        var spreadsheetId = _configuration["GoogleSheets:SpreadsheetId"];
        var credentialsJson = _configuration["GoogleSheets:CredentialsJson"];
        var credentialsPath = _configuration["GoogleSheets:CredentialsPath"];

        if (string.IsNullOrEmpty(spreadsheetId))
        {
            _logger.LogWarning("Google Sheets not configured - skipping sync");
            return;
        }

        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<Data.ApplicationDbContext>();

        GoogleCredential credential;

        if (!string.IsNullOrEmpty(credentialsJson))
        {
            var jsonBytes = Convert.FromBase64String(credentialsJson);
            using var stream = new MemoryStream(jsonBytes);
            credential = GoogleCredential.FromStream(stream)
                .CreateScoped(SheetsService.Scope.SpreadsheetsReadonly);
        }
        else if (!string.IsNullOrEmpty(credentialsPath))
        {
            using var stream = new FileStream(credentialsPath, FileMode.Open, FileAccess.Read);
            credential = GoogleCredential.FromStream(stream)
                .CreateScoped(SheetsService.Scope.SpreadsheetsReadonly);
        }
        else
        {
            _logger.LogWarning("Google Sheets credentials not configured - skipping sync");
            return;
        }

        using var sheetsService = new SheetsService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = "CU Roadmap Sync"
        });

        // Read courses sheet
        var coursesRange = _configuration["GoogleSheets:CoursesRange"] ?? "Courses!A:Z";
        var coursesRequest = sheetsService.Spreadsheets.Values.Get(spreadsheetId, coursesRange);
        var coursesResponse = await coursesRequest.ExecuteAsync(ct);
        var coursesRows = coursesResponse.Values;

        if (coursesRows is null || coursesRows.Count <= 1)
        {
            _logger.LogWarning("No course data found in sheet");
            return;
        }

        // Read majors sheet
        var majorsRange = _configuration["GoogleSheets:MajorsRange"] ?? "Majors!A:Z";
        var majorsRequest = sheetsService.Spreadsheets.Values.Get(spreadsheetId, majorsRange);
        var majorsResponse = await majorsRequest.ExecuteAsync(ct);
        var majorsRows = majorsResponse.Values;

        await SyncCoursesAsync(context, coursesRows, ct);
        if (majorsRows is not null && majorsRows.Count > 1)
        {
            await SyncMajorsAsync(context, majorsRows, ct);
        }

        _logger.LogInformation("Google Sheets sync completed");
    }

    private static async Task SyncCoursesAsync(
        Data.ApplicationDbContext context,
        IList<IList<object>> rows,
        CancellationToken ct)
    {
        var header = rows[0].Select(c => c.ToString()?.Trim().ToLowerInvariant()).ToList();

        var titleIdx = header.IndexOf("title");
        var typeIdx = header.IndexOf("type");
        var categoryIdx = header.IndexOf("category");
        var cohortIdx = header.IndexOf("cohort");
        var semesterIdx = header.IndexOf("semester");
        var workloadIdx = header.IndexOf("workload");
        var descriptionIdx = header.IndexOf("description");
        var analogIdx = header.IndexOf("analog");

        for (var i = 1; i < rows.Count; i++)
        {
            var row = rows[i];
            if (row.Count < 3) continue;

            var title = GetCell(row, titleIdx) ?? $"Course {i}";
            var typeStr = GetCell(row, typeIdx) ?? "mandatory";
            var categoryStr = GetCell(row, categoryIdx) ?? "fundamentals";
            var cohortStr = GetCell(row, cohortIdx);
            var semesterStr = GetCell(row, semesterIdx);
            var workloadStr = GetCell(row, workloadIdx);
            var description = GetCell(row, descriptionIdx);
            var analogGroup = GetCell(row, analogIdx) ?? string.Empty;

            if (!Enum.TryParse<CourseType>(typeStr, true, out var courseType))
                courseType = CourseType.Mandatory;
            if (!Enum.TryParse<CourseCategory>(categoryStr, true, out var category))
                category = CourseCategory.Fundamentals;

            var cohorts = string.IsNullOrEmpty(cohortStr)
                ? Array.Empty<int>()
                : cohortStr.Split(',').Select(s => { int.TryParse(s.Trim(), out var y); return y; }).Where(y => y > 0).ToArray();

            var semesters = string.IsNullOrEmpty(semesterStr)
                ? Array.Empty<int>()
                : semesterStr.Split(',').Select(s => { int.TryParse(s.Trim(), out var y); return y; }).Where(y => y > 0).ToArray();

            double.TryParse(workloadStr, out var workload);

            // Check if course exists by title
            var existing = await context.Courses
                .FirstOrDefaultAsync(c => c.Title == title, ct);

            if (existing is not null)
            {
                existing.CourseType = courseType;
                existing.Category = category;
                existing.AllowedCohorts = cohorts;
                existing.AvailableSemesters = semesters;
                existing.Workload = workload;
                existing.Description = description ?? existing.Description;
                existing.AnalogGroup = analogGroup;
            }
            else
            {
                context.Courses.Add(new Course
                {
                    Id = Guid.NewGuid(),
                    Title = title,
                    Description = description,
                    CourseType = courseType,
                    Category = category,
                    AllowedCohorts = cohorts,
                    AvailableSemesters = semesters,
                    Workload = workload,
                    AnalogGroup = analogGroup
                });
            }
        }

        await context.SaveChangesAsync(ct);
    }

    private static async Task SyncMajorsAsync(
        Data.ApplicationDbContext context,
        IList<IList<object>> rows,
        CancellationToken ct)
    {
        var header = rows[0].Select(c => c.ToString()?.Trim().ToLowerInvariant()).ToList();

        var titleIdx = header.IndexOf("title");
        var schoolIdx = header.IndexOf("school");
        var cohortIdx = header.IndexOf("cohort");

        for (var i = 1; i < rows.Count; i++)
        {
            var row = rows[i];
            if (row.Count < 2) continue;

            var title = GetCell(row, titleIdx) ?? $"Major {i}";
            var school = GetCell(row, schoolIdx) ?? string.Empty;
            var cohortStr = GetCell(row, cohortIdx);
            int.TryParse(cohortStr, out var cohortYear);

            var existing = await context.Majors
                .FirstOrDefaultAsync(m => m.Title == title && m.CohortYear == cohortYear, ct);

            if (existing is null)
            {
                context.Majors.Add(new Major
                {
                    Id = Guid.NewGuid(),
                    Title = title,
                    School = school,
                    CohortYear = cohortYear
                });
            }
        }

        await context.SaveChangesAsync(ct);
    }

    private static string? GetCell(IList<object> row, int index)
    {
        if (index < 0 || index >= row.Count) return null;
        return row[index]?.ToString();
    }
}
