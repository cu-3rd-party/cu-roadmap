namespace CuRoadmapBackend.Models;

public sealed class Course
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? HandbookLink { get; set; }
    public CourseType CourseType { get; set; }
    public CourseCategory Category { get; set; }
    public int[]? AllowedCohorts { get; set; }
    public int[] AvailableSemesters { get; set; } = [];
    public int? RecommendedSemester { get; set; }
    public double Workload { get; set; }
    public double? CsatMetric { get; set; }
    public List<CourseDependency> CourseDependencies { get; set; } = [];
    public List<MajorRequirement> MajorRequirements { get; set; } = [];
    public List<Student> StudentsWhoPassed { get; set; } = [];
}
