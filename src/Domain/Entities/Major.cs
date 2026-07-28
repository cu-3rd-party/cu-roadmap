namespace CuRoadmap.Domain.Entities;

public class Major
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string School { get; set; } = string.Empty;
    public int CohortYear { get; set; }
    public Guid? RequirementsBoxId { get; set; }

    public Box? RequirementsBox { get; set; }
    public ICollection<Specialization> Specializations { get; set; } = new List<Specialization>();
}
