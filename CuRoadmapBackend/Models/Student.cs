namespace CuRoadmapBackend.Models;

public sealed class Student
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int Cohort { get; set; }
    public int CurrentSemester { get; set; }
    public Guid? TargetMajorId { get; set; }
    public Major? TargetMajor { get; set; }
    public List<Course> PassedCourses { get; set; } = [];
}
