namespace CuRoadmapBackend.Models;

public sealed class CourseDependency
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CourseId { get; set; }
    public Guid RequiredCourseId { get; set; }
    public DependencyType DependencyType { get; set; }
    public Course? Course { get; set; }
    public Course? RequiredCourse { get; set; }
}
