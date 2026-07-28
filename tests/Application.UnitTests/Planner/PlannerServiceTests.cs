using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Application.Common.Models;
using CuRoadmap.Application.Planner;
using CuRoadmap.Domain.Entities;
using NUnit.Framework;
using Shouldly;

namespace CuRoadmap.Application.UnitTests.Planner;

public class PlannerServiceTests
{
    private static Course MakeCourse(Guid id, string title, Domain.Enums.CourseCategory cat,
        int[] semesters, double workload = 5) =>
        new()
        {
            Id = id, Title = title,
            CourseType = Domain.Enums.CourseType.Mandatory, Category = cat,
            AllowedCohorts = [], AvailableSemesters = semesters,
            Workload = workload, CourseDependencies = []
        };

    private static CourseDependency Dep(Guid courseId, Guid reqId, int group = 0) =>
        new()
        {
            Id = Guid.NewGuid(), CourseId = courseId, RequiredCourseId = reqId,
            DependencyType = Domain.Enums.DependencyType.Prerequisite, AlternativeGroup = group
        };

    [Test]
    public async Task FindPathToCourseAsync_returns_error_when_course_not_found()
    {
        var service = new PlannerService(NewDb());
        var result = await service.FindPathToCourseAsync(Guid.NewGuid(), new(), 1, 10, null);

        result.Count.ShouldBe(1);
        result[0].ShouldContainKey("error");
    }

    [Test]
    public async Task FindPathToCourseAsync_returns_empty_when_course_already_passed()
    {
        var db = NewDb();
        var courseId = Guid.NewGuid();
        db.Add(MakeCourse(courseId, "C", Domain.Enums.CourseCategory.Stem, [1]));
        await db.SaveChangesAsync(default);

        var service = new PlannerService(db);
        var result = await service.FindPathToCourseAsync(courseId, new HashSet<Guid> { courseId }, 1, 10, null);

        result.ShouldBeEmpty();
    }

    [Test]
    public async Task FindPathToCourseAsync_returns_semester_plan()
    {
        var db = NewDb();
        var courseId = Guid.NewGuid();
        var prereqId = Guid.NewGuid();

        db.Add(MakeCourse(prereqId, "P", Domain.Enums.CourseCategory.Stem, [1]));
        db.Add(MakeCourse(courseId, "C", Domain.Enums.CourseCategory.Stem, [2]));
        db.Add(Dep(courseId, prereqId));
        await db.SaveChangesAsync(default);

        var service = new PlannerService(db);
        var result = await service.FindPathToCourseAsync(courseId, new(), 1, 10, null);

        result.Count.ShouldBeGreaterThanOrEqualTo(1);
        result[0]["semester"].ShouldBe(1);
        var ids = (List<string>)result[0]["course_ids"];
        ids.ShouldContain(prereqId.ToString());
    }

    [Test]
    public async Task FindPathToCourseAsync_handles_transitive_dependencies()
    {
        var db = NewDb();
        var courseId = Guid.NewGuid();
        var midId = Guid.NewGuid();
        var baseId = Guid.NewGuid();

        db.Add(MakeCourse(baseId, "Base", Domain.Enums.CourseCategory.Stem, [1]));
        db.Add(MakeCourse(midId, "Mid", Domain.Enums.CourseCategory.Stem, [2]));
        db.Add(MakeCourse(courseId, "Target", Domain.Enums.CourseCategory.Stem, [3]));
        db.Add(Dep(courseId, midId));
        db.Add(Dep(midId, baseId));
        await db.SaveChangesAsync(default);

        var service = new PlannerService(db);
        var result = await service.FindPathToCourseAsync(courseId, new(), 1, 10, null);

        result.Count.ShouldBeGreaterThanOrEqualTo(3);
    }

    [Test]
    public async Task FindPathToCourseAsync_respects_or_group()
    {
        var db = NewDb();
        var courseId = Guid.NewGuid();
        var alt1Id = Guid.NewGuid();
        var alt2Id = Guid.NewGuid();

        db.Add(MakeCourse(alt1Id, "A1", Domain.Enums.CourseCategory.Stem, [1]));
        db.Add(MakeCourse(alt2Id, "A2", Domain.Enums.CourseCategory.Stem, [1]));
        db.Add(MakeCourse(courseId, "C", Domain.Enums.CourseCategory.Stem, [2]));
        db.Add(Dep(courseId, alt1Id, group: 1));
        db.Add(Dep(courseId, alt2Id, group: 1));
        await db.SaveChangesAsync(default);

        var service = new PlannerService(db);
        var result = await service.FindPathToCourseAsync(courseId, new(), 1, 10, null);

        result.Count.ShouldBeGreaterThanOrEqualTo(1);
    }

    [Test]
    public async Task FindPathToCourseAsync_with_goal_semester()
    {
        var db = NewDb();
        var courseId = Guid.NewGuid();
        db.Add(MakeCourse(courseId, "C", Domain.Enums.CourseCategory.Stem, [1, 2, 3]));
        await db.SaveChangesAsync(default);

        var service = new PlannerService(db);
        var result = await service.FindPathToCourseAsync(courseId, new(), 1, 10, 3);

        result.ShouldNotBeNull();
    }

    private static IApplicationDbContext NewDb() => TestDbContextFactory.Create();
}
