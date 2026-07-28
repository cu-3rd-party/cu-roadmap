using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Application.Common.Models;

namespace CuRoadmap.Application.Requirements;

public record LeafSelection(Guid BoxId, Guid CourseId, int Depth);

public record Projection(
    Guid Id,
    Guid MajorId,
    Guid CourseId,
    Domain.Enums.RequirementType RequirementType,
    string[] Specializations,
    string[] MandatorySpecializations);

public class RequirementGraph
{
    public Dictionary<Guid, BoxData> Boxes { get; }
    public Dictionary<Guid, List<BoxEdgeData>> Children { get; }
    public Dictionary<Guid, List<BoxEdgeData>> Parents { get; }
    public Dictionary<Guid, CourseData> Courses { get; }

    public RequirementGraph(
        Dictionary<Guid, BoxData> boxes,
        List<BoxEdgeData> edges,
        Dictionary<Guid, CourseData> courses)
    {
        Boxes = boxes;
        Children = new Dictionary<Guid, List<BoxEdgeData>>();
        Parents = new Dictionary<Guid, List<BoxEdgeData>>();
        Courses = courses;

        foreach (var edge in edges)
        {
            if (!Children.ContainsKey(edge.ParentBoxId))
                Children[edge.ParentBoxId] = new List<BoxEdgeData>();
            Children[edge.ParentBoxId].Add(edge);

            if (!Parents.ContainsKey(edge.ChildBoxId))
                Parents[edge.ChildBoxId] = new List<BoxEdgeData>();
            Parents[edge.ChildBoxId].Add(edge);
        }

        foreach (var parentId in Children.Keys)
        {
            Children[parentId] = Children[parentId]
                .OrderBy(e => e.Position)
                .ThenBy(e => e.ChildBoxId.ToString())
                .ToList();
        }
    }

    public List<BoxData> DescendantLeaves(Guid rootId)
    {
        var visitedPath = new HashSet<Guid>();
        var result = new List<BoxData>();

        void Walk(Guid boxId)
        {
            if (visitedPath.Contains(boxId))
                throw new InvalidOperationException($"Requirement graph cycle detected at {boxId}");

            if (!Boxes.TryGetValue(boxId, out var box))
                throw new InvalidOperationException($"Box {boxId} not found");

            visitedPath.Add(boxId);

            if (box.Kind == Domain.Enums.BoxKind.Course)
            {
                result.Add(box);
            }
            else if (Children.TryGetValue(boxId, out var children))
            {
                foreach (var edge in children)
                    Walk(edge.ChildBoxId);
            }

            visitedPath.Remove(boxId);
        }

        Walk(rootId);
        return result;
    }
}
