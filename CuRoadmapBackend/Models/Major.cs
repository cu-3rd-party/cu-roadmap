namespace CuRoadmapBackend.Models;

public sealed class Major
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string School { get; set; } = string.Empty;
    public int CohortYear { get; set; }
    public List<MajorRequirement> Requirements { get; set; } = [];
    public List<Student> TargetStudents { get; set; } = [];
}
