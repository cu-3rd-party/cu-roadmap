namespace CuRoadmap.Domain.Entities;

public class Box
{
    public Guid Id { get; set; }
    public Enums.BoxKind Kind { get; set; }
    public string Title { get; set; } = string.Empty;
    public Guid? CourseId { get; set; }
    public Enums.LogicalOp? LogicalOp { get; set; }
    public int RequiredCount { get; set; }
    public Enums.RequirementType? RequirementType { get; set; }
    public string[] Specializations { get; set; } = [];
    public string[] MandatorySpecializations { get; set; } = [];
    public int? AdmissionYear { get; set; }
    public string? MajorTrack { get; set; }

    public Course? Course { get; set; }
    public ICollection<BoxEdge> OutgoingRequirements { get; set; } = new List<BoxEdge>();
    public ICollection<BoxEdge> IncomingRequirements { get; set; } = new List<BoxEdge>();
}
