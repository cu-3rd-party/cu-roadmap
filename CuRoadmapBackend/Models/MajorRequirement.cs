namespace CuRoadmapBackend.Models;

public sealed class MajorRequirement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MajorId { get; set; }
    public Guid CourseId { get; set; }
    public RequirementType RequirementType { get; set; }
    public Major? Major { get; set; }
    public Course? Course { get; set; }
}
