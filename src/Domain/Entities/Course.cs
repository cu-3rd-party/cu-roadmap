namespace CuRoadmap.Domain.Entities;

public class Course
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? HandbookLink { get; set; }
    public Enums.CourseType CourseType { get; set; }
    public Enums.CourseCategory Category { get; set; }
    public int[] AllowedCohorts { get; set; } = [];
    public int[] AvailableSemesters { get; set; } = [];
    public int? RecommendedSemester { get; set; }
    public double Workload { get; set; }
    public int SeminarsWeek { get; set; } = 1;
    public int LecturesWeek { get; set; }
    public string AnalogGroup { get; set; } = string.Empty;
    public double? CsatMetric { get; set; }

    public ICollection<CourseDependency> CourseDependencies { get; set; } = new List<CourseDependency>();
}
