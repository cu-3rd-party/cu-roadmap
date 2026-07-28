namespace CuRoadmap.Domain.Entities;

public class Specialization
{
    public Guid Id { get; set; }
    public Guid MajorId { get; set; }
    public string Title { get; set; } = string.Empty;
    public Guid? RequirementsBoxId { get; set; }

    public Major Major { get; set; } = null!;
    public Box? RequirementsBox { get; set; }
}
