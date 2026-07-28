using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Application.Common.Models;
using CuRoadmap.Application.Requirements;
using CuRoadmap.Domain.Entities;
using NUnit.Framework;
using Shouldly;

namespace CuRoadmap.Application.UnitTests.Requirements;

public class RequirementResolverTests
{
    [Test]
    public void AnalogGroupsIntersect_returns_true_when_groups_share_element()
    {
        RequirementResolver.AnalogGroupsIntersect("MATH, PHYS", "PHYS, CHEM").ShouldBeTrue();
    }

    [Test]
    public void AnalogGroupsIntersect_returns_false_when_no_overlap()
    {
        RequirementResolver.AnalogGroupsIntersect("MATH", "PHYS").ShouldBeFalse();
    }

    [Test]
    public void AnalogGroupsIntersect_returns_false_when_either_null_or_empty()
    {
        RequirementResolver.AnalogGroupsIntersect("", "MATH").ShouldBeFalse();
        RequirementResolver.AnalogGroupsIntersect("MATH", "").ShouldBeFalse();
        RequirementResolver.AnalogGroupsIntersect("  ", "MATH").ShouldBeFalse();
    }

    [Test]
    public async Task MajorLeafCourseIdsAsync_returns_course_ids()
    {
        var db = NewDb();
        var courseId = Guid.NewGuid();
        var majorId = Guid.NewGuid();
        var boxId = Guid.NewGuid();

        db.Add(new Major { Id = majorId, Title = "M", School = "CS", CohortYear = 2024, RequirementsBoxId = boxId });
        db.Add(new Box { Id = boxId, Kind = Domain.Enums.BoxKind.Course, CourseId = courseId, RequirementType = Domain.Enums.RequirementType.MajorCore });
        db.Add(new Course { Id = courseId, Title = "C", CourseType = Domain.Enums.CourseType.Mandatory, Category = Domain.Enums.CourseCategory.Stem, AllowedCohorts = [], AvailableSemesters = [] });
        await db.SaveChangesAsync(default);

        var resolver = new RequirementResolver(db);
        var result = await resolver.MajorLeafCourseIdsAsync(majorId);

        result.ShouldContain(courseId);
        result.Count.ShouldBe(1);
    }

    [Test]
    public async Task MajorLeafCourseIdsAsync_returns_empty_when_no_requirements_box()
    {
        var db = NewDb();
        var majorId = Guid.NewGuid();
        db.Add(new Major { Id = majorId, Title = "M", School = "CS", CohortYear = 2024, RequirementsBoxId = null });
        await db.SaveChangesAsync(default);

        var resolver = new RequirementResolver(db);
        var result = await resolver.MajorLeafCourseIdsAsync(majorId);
        result.ShouldBeEmpty();
    }

    [Test]
    public async Task ProjectMajorRequirementsAsync_returns_projections()
    {
        var db = NewDb();
        var courseId = Guid.NewGuid();
        var majorId = Guid.NewGuid();
        var boxId = Guid.NewGuid();

        db.Add(new Major { Id = majorId, Title = "M", School = "CS", CohortYear = 2024, RequirementsBoxId = boxId });
        db.Add(new Box { Id = boxId, Kind = Domain.Enums.BoxKind.Course, CourseId = courseId, RequirementType = Domain.Enums.RequirementType.MajorCore });
        db.Add(new Course { Id = courseId, Title = "C", CourseType = Domain.Enums.CourseType.Mandatory, Category = Domain.Enums.CourseCategory.Stem, AllowedCohorts = [], AvailableSemesters = [] });
        await db.SaveChangesAsync(default);

        var resolver = new RequirementResolver(db);
        var result = await resolver.ProjectMajorRequirementsAsync(majorId);

        result.Count.ShouldBe(1);
        result[0].MajorId.ShouldBe(majorId);
        result[0].CourseId.ShouldBe(courseId);
        result[0].RequirementType.ShouldBe(Domain.Enums.RequirementType.MajorCore);
    }

    [Test]
    public async Task MajorCoreCourseIdsAsync_returns_only_core_courses()
    {
        var db = NewDb();
        var majorId = Guid.NewGuid();
        var rootId = Guid.NewGuid();
        var coreId = Guid.NewGuid();
        var choiceId = Guid.NewGuid();

        db.Add(new Major { Id = majorId, Title = "M", School = "CS", CohortYear = 2024, RequirementsBoxId = rootId });
        db.Add(new Box { Id = rootId, Kind = Domain.Enums.BoxKind.Course, CourseId = coreId, RequirementType = Domain.Enums.RequirementType.MajorCore, Specializations = [], MandatorySpecializations = [] });
        db.Add(new Box { Id = Guid.NewGuid(), Kind = Domain.Enums.BoxKind.Course, CourseId = choiceId, RequirementType = Domain.Enums.RequirementType.MajorChoice, Specializations = [], MandatorySpecializations = [] });
        db.Add(new Course { Id = coreId, Title = "Core", CourseType = Domain.Enums.CourseType.Mandatory, Category = Domain.Enums.CourseCategory.Stem, AllowedCohorts = [], AvailableSemesters = [] });
        db.Add(new Course { Id = choiceId, Title = "Choice", CourseType = Domain.Enums.CourseType.Elective, Category = Domain.Enums.CourseCategory.Soft, AllowedCohorts = [], AvailableSemesters = [] });
        await db.SaveChangesAsync(default);

        var resolver = new RequirementResolver(db);
        var coreIds = await resolver.MajorCoreCourseIdsAsync(majorId);

        coreIds.ShouldContain(coreId);
        coreIds.ShouldNotContain(choiceId);
    }

    [Test]
    public async Task MajorChoiceCourseIdsAsync_returns_only_choice_courses()
    {
        var db = NewDb();
        var majorId = Guid.NewGuid();
        var rootId = Guid.NewGuid();
        var coreId = Guid.NewGuid();
        var choiceId = Guid.NewGuid();

        db.Add(new Major { Id = majorId, Title = "M", School = "CS", CohortYear = 2024, RequirementsBoxId = rootId });
        db.Add(new Box { Id = rootId, Kind = Domain.Enums.BoxKind.Course, CourseId = choiceId, RequirementType = Domain.Enums.RequirementType.MajorChoice, Specializations = [], MandatorySpecializations = [] });
        db.Add(new Box { Id = Guid.NewGuid(), Kind = Domain.Enums.BoxKind.Course, CourseId = coreId, RequirementType = Domain.Enums.RequirementType.MajorCore, Specializations = [], MandatorySpecializations = [] });
        db.Add(new Course { Id = choiceId, Title = "Choice", CourseType = Domain.Enums.CourseType.Elective, Category = Domain.Enums.CourseCategory.Soft, AllowedCohorts = [], AvailableSemesters = [] });
        db.Add(new Course { Id = coreId, Title = "Core", CourseType = Domain.Enums.CourseType.Mandatory, Category = Domain.Enums.CourseCategory.Stem, AllowedCohorts = [], AvailableSemesters = [] });
        await db.SaveChangesAsync(default);

        var resolver = new RequirementResolver(db);
        var choiceIds = await resolver.MajorChoiceCourseIdsAsync(majorId);

        choiceIds.ShouldContain(choiceId);
        choiceIds.ShouldNotContain(coreId);
    }

    [Test]
    public async Task SpecializationCourseIdsAsync_returns_courses_from_spec()
    {
        var db = NewDb();
        var rootId = Guid.NewGuid();
        var courseId = Guid.NewGuid();

        db.Add(new Box { Id = rootId, Kind = Domain.Enums.BoxKind.Course, CourseId = courseId, Specializations = [], MandatorySpecializations = [] });
        await db.SaveChangesAsync(default);

        var resolver = new RequirementResolver(db);
        var spec = new SpecializationData(Guid.NewGuid(), Guid.NewGuid(), "Spec", rootId);
        var result = await resolver.SpecializationCourseIdsAsync(spec);

        result.ShouldContain(courseId);
    }

    [Test]
    public async Task ResolveTargetCourseIdsAsync_resolves_major_requirement_tree()
    {
        var db = NewDb();
        var majorId = Guid.NewGuid();
        var andOpId = Guid.NewGuid();
        var courseAId = Guid.NewGuid();
        var courseBId = Guid.NewGuid();

        db.Add(new Major { Id = majorId, Title = "M", School = "CS", CohortYear = 2024, RequirementsBoxId = andOpId });

        var boxA = new Box { Id = Guid.NewGuid(), Kind = Domain.Enums.BoxKind.Course, CourseId = courseAId, RequirementType = Domain.Enums.RequirementType.MajorCore, Specializations = [], MandatorySpecializations = [] };
        var boxB = new Box { Id = Guid.NewGuid(), Kind = Domain.Enums.BoxKind.Course, CourseId = courseBId, RequirementType = Domain.Enums.RequirementType.MajorChoice, Specializations = [], MandatorySpecializations = [] };
        var andBox = new Box { Id = andOpId, Kind = Domain.Enums.BoxKind.Logical, LogicalOp = Domain.Enums.LogicalOp.And, Specializations = [], MandatorySpecializations = [] };
        db.Add(boxA);
        db.Add(boxB);
        db.Add(andBox);

        db.Add(new BoxEdge { Id = Guid.NewGuid(), ParentBoxId = andOpId, ChildBoxId = boxA.Id, Position = 0 });
        db.Add(new BoxEdge { Id = Guid.NewGuid(), ParentBoxId = andOpId, ChildBoxId = boxB.Id, Position = 1 });

        db.Add(new Course { Id = courseAId, Title = "A", CourseType = Domain.Enums.CourseType.Mandatory, Category = Domain.Enums.CourseCategory.Stem, AllowedCohorts = [], AvailableSemesters = [] });
        db.Add(new Course { Id = courseBId, Title = "B", CourseType = Domain.Enums.CourseType.Mandatory, Category = Domain.Enums.CourseCategory.Stem, AllowedCohorts = [], AvailableSemesters = [] });
        await db.SaveChangesAsync(default);

        var resolver = new RequirementResolver(db);
        var result = await resolver.ResolveTargetCourseIdsAsync(
            majorId, null, new(), new(), 2024);

        result.Count.ShouldBe(2);
        result.ShouldContain(courseAId);
        result.ShouldContain(courseBId);
    }

    private static IApplicationDbContext NewDb() => TestDbContextFactory.Create();
}
