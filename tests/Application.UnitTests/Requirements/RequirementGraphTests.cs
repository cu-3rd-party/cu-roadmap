using CuRoadmap.Application.Common.Models;
using CuRoadmap.Application.Requirements;
using NUnit.Framework;
using Shouldly;

namespace CuRoadmap.Application.UnitTests.Requirements;

public class RequirementGraphTests
{
    [Test]
    public void Constructor_builds_child_and_parent_maps()
    {
        var boxA = new BoxData(Guid.NewGuid(), Domain.Enums.BoxKind.Course, "A", null, null, 0, null, [], [], null, null);
        var boxB = new BoxData(Guid.NewGuid(), Domain.Enums.BoxKind.Logical, "AND", null, Domain.Enums.LogicalOp.And, 0, null, [], [], null, null);
        var edge = new BoxEdgeData(Guid.NewGuid(), boxB.Id, boxA.Id, 0);

        var graph = new RequirementGraph(
            new() { [boxA.Id] = boxA, [boxB.Id] = boxB },
            [edge],
            new());

        graph.Children[boxB.Id].ShouldHaveSingleItem();
        graph.Children[boxB.Id][0].ShouldBe(edge);
        graph.Parents[boxA.Id].ShouldHaveSingleItem();
        graph.Parents[boxA.Id][0].ShouldBe(edge);
    }

    [Test]
    public void Children_ordered_by_position_then_id()
    {
        var id1 = Guid.NewGuid();
        var id2 = Guid.NewGuid();
        var parentId = Guid.NewGuid();
        var box1 = new BoxData(id1, Domain.Enums.BoxKind.Course, "A", null, null, 0, null, [], [], null, null);
        var box2 = new BoxData(id2, Domain.Enums.BoxKind.Course, "B", null, null, 0, null, [], [], null, null);
        var parent = new BoxData(parentId, Domain.Enums.BoxKind.Logical, "P", null, Domain.Enums.LogicalOp.And, 0, null, [], [], null, null);
        var e1First = new BoxEdgeData(Guid.NewGuid(), parentId, id1, 1);
        var e2Second = new BoxEdgeData(Guid.NewGuid(), parentId, id2, 0);

        var graph = new RequirementGraph(
            new() { [id1] = box1, [id2] = box2, [parentId] = parent },
            [e1First, e2Second],
            new());

        graph.Children[parentId][0].ChildBoxId.ShouldBe(id2);
        graph.Children[parentId][1].ChildBoxId.ShouldBe(id1);
    }

    [Test]
    public void DescendantLeaves_returns_course_boxes()
    {
        var courseIdA = Guid.NewGuid();
        var courseIdB = Guid.NewGuid();
        var andId = Guid.NewGuid();
        var boxA = new BoxData(courseIdA, Domain.Enums.BoxKind.Course, "A", courseIdA, null, 0, Domain.Enums.RequirementType.MajorCore, [], [], null, null);
        var boxB = new BoxData(courseIdB, Domain.Enums.BoxKind.Course, "B", courseIdB, null, 0, Domain.Enums.RequirementType.MajorChoice, [], [], null, null);
        var andBox = new BoxData(andId, Domain.Enums.BoxKind.Logical, "AND", null, Domain.Enums.LogicalOp.And, 0, null, [], [], null, null);
        var edges = new List<BoxEdgeData>
        {
            new(Guid.NewGuid(), andId, courseIdA, 0),
            new(Guid.NewGuid(), andId, courseIdB, 1),
        };

        var graph = new RequirementGraph(
            new() { [courseIdA] = boxA, [courseIdB] = boxB, [andId] = andBox },
            edges, new());

        var leaves = graph.DescendantLeaves(andId);

        leaves.Count.ShouldBe(2);
        leaves.Select(l => l.Id).ShouldBe(new[] { courseIdA, courseIdB }, ignoreOrder: true);
    }

    [Test]
    public void DescendantLeaves_skips_non_course_inner_nodes()
    {
        var courseId = Guid.NewGuid();
        var innerAndId = Guid.NewGuid();
        var rootAndId = Guid.NewGuid();
        var boxCourse = new BoxData(courseId, Domain.Enums.BoxKind.Course, "C", courseId, null, 0, null, [], [], null, null);
        var boxInner = new BoxData(innerAndId, Domain.Enums.BoxKind.Logical, "Inner", null, Domain.Enums.LogicalOp.And, 0, null, [], [], null, null);
        var boxRoot = new BoxData(rootAndId, Domain.Enums.BoxKind.Logical, "Root", null, Domain.Enums.LogicalOp.And, 0, null, [], [], null, null);
        var edges = new List<BoxEdgeData>
        {
            new(Guid.NewGuid(), rootAndId, innerAndId, 0),
            new(Guid.NewGuid(), innerAndId, courseId, 0),
        };

        var graph = new RequirementGraph(
            new() { [courseId] = boxCourse, [innerAndId] = boxInner, [rootAndId] = boxRoot },
            edges, new());

        var leaves = graph.DescendantLeaves(rootAndId);

        leaves.ShouldHaveSingleItem();
        leaves[0].Id.ShouldBe(courseId);
    }

    [Test]
    public void DescendantLeaves_throws_on_cycle()
    {
        var boxIdA = Guid.NewGuid();
        var boxIdB = Guid.NewGuid();
        var boxA = new BoxData(boxIdA, Domain.Enums.BoxKind.Logical, "A", null, Domain.Enums.LogicalOp.And, 0, null, [], [], null, null);
        var boxB = new BoxData(boxIdB, Domain.Enums.BoxKind.Logical, "B", null, Domain.Enums.LogicalOp.And, 0, null, [], [], null, null);
        var edges = new List<BoxEdgeData>
        {
            new(Guid.NewGuid(), boxIdA, boxIdB, 0),
            new(Guid.NewGuid(), boxIdB, boxIdA, 0),
        };

        var graph = new RequirementGraph(
            new() { [boxIdA] = boxA, [boxIdB] = boxB },
            edges, new());

        Should.Throw<InvalidOperationException>(() => graph.DescendantLeaves(boxIdA));
    }

    [Test]
    public void DescendantLeaves_throws_on_missing_box()
    {
        var graph = new RequirementGraph(new(), [], new());
        Should.Throw<InvalidOperationException>(() => graph.DescendantLeaves(Guid.NewGuid()));
    }

    [Test]
    public void DescendantLeaves_returns_empty_list_for_box_without_children()
    {
        var rootId = Guid.NewGuid();
        var rootBox = new BoxData(rootId, Domain.Enums.BoxKind.Logical, "Empty", null, Domain.Enums.LogicalOp.And, 0, null, [], [], null, null);
        var graph = new RequirementGraph(new() { [rootId] = rootBox }, [], new());
        var leaves = graph.DescendantLeaves(rootId);
        leaves.ShouldBeEmpty();
    }

    [Test]
    public void Constructor_handles_empty_inputs()
    {
        var graph = new RequirementGraph(new(), [], new());
        graph.Boxes.ShouldBeEmpty();
        graph.Children.ShouldBeEmpty();
        graph.Parents.ShouldBeEmpty();
        graph.Courses.ShouldBeEmpty();
    }
}
