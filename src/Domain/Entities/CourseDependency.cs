namespace CuRoadmap.Domain.Entities;

public class CourseDependency
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid RequiredCourseId { get; set; }
    public Enums.DependencyType DependencyType { get; set; }
    public int AlternativeGroup { get; set; }

    public Course Course { get; set; } = null!;
    public Course RequiredCourse { get; set; } = null!;
}
