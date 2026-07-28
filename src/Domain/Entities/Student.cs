namespace CuRoadmap.Domain.Entities;

public class Student
{
    public Guid Id { get; set; }
    public int Cohort { get; set; }
    public int CurrentSemester { get; set; }
    public Guid? TargetMajorId { get; set; }

    public Major? TargetMajor { get; set; }
    public ICollection<Course> PassedCourses { get; set; } = new List<Course>();
}
