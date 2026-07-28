namespace CuRoadmap.Domain.Entities;

public class BoxEdge
{
    public Guid Id { get; set; }
    public Guid ParentBoxId { get; set; }
    public Guid ChildBoxId { get; set; }
    public int Position { get; set; }

    public Box ParentBox { get; set; } = null!;
    public Box ChildBox { get; set; } = null!;
}
