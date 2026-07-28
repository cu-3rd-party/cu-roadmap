using CuRoadmap.Application.Common.Interfaces;
using CuRoadmap.Application.Common.Models;
using CuRoadmap.Application.Planner;
using CuRoadmap.Domain.Entities;
using NUnit.Framework;
using Shouldly;

namespace CuRoadmap.Application.UnitTests.Planner;

public class RoadmapValidatorTests
{
    private const double MaxLoad = 10;

    private static Course MakeCourse(Guid id, string title, Domain.Enums.CourseCategory cat,
        int[]? semesters = null, double workload = 5, string analogGroup = "") =>
        new()
        {
            Id = id, Title = title,
            CourseType = Domain.Enums.CourseType.Mandatory, Category = cat,
            AllowedCohorts = [], AvailableSemesters = semesters ?? [],
            Workload = workload, AnalogGroup = analogGroup, CourseDependencies = []
        };

    private static async Task<(RoadmapValidator, IApplicationDbContext)> CreateValidator(
        List<Course> courses, List<CourseDependency>? deps = null)
    {
        var db = TestDbContextFactory.Create();
        foreach (var c in courses) db.Add(c);
        await db.SaveChangesAsync(default);
        if (deps is not null)
        {
            foreach (var d in deps) db.Add(d);
            await db.SaveChangesAsync(default);
        }

        var validator = new RoadmapValidator(db);
        await validator.LoadDataAsync();
        return (validator, db);
    }

    [Test]
    public async Task ValidateSemesterAsync_detects_overload()
    {
        var id = Guid.NewGuid();
        var (v, _) = await CreateValidator([
            MakeCourse(id, "Heavy", Domain.Enums.CourseCategory.Stem, workload: 12)
        ]);

        var result = await v.ValidateSemesterAsync([id], new(), 1, MaxLoad);

        result.IsValid.ShouldBeTrue();
        result.Messages.ShouldContain(m => m.Message.Contains("Превышена нагрузка"));
    }

    [Test]
    public async Task ValidateSemesterAsync_detects_wrong_semester_offering()
    {
        var id = Guid.NewGuid();
        var (v, _) = await CreateValidator([
            MakeCourse(id, "OnlyInFall", Domain.Enums.CourseCategory.Stem, [1, 3])
        ]);

        var result = await v.ValidateSemesterAsync([id], new(), 2, MaxLoad);

        result.IsValid.ShouldBeFalse();
        result.Messages.ShouldContain(m => m.Level == "error" && m.Message.Contains("не читается"));
    }

    [Test]
    public async Task ValidateSemesterAsync_valid_when_semester_offering_matches()
    {
        var id = Guid.NewGuid();
        var (v, _) = await CreateValidator([
            MakeCourse(id, "OfferedSpring", Domain.Enums.CourseCategory.Stem, [2, 4])
        ]);

        var result = await v.ValidateSemesterAsync([id], new(), 2, MaxLoad);

        result.Messages.ShouldNotContain(m => m.Level == "error" && m.Message.Contains("не читается"));
    }

    [Test]
    public async Task ValidateSemesterAsync_missing_stem_emits_error()
    {
        var id = Guid.NewGuid();
        var (v, _) = await CreateValidator([
            MakeCourse(id, "SoftCourse", Domain.Enums.CourseCategory.Soft)
        ]);

        var result = await v.ValidateSemesterAsync([id], new(), 1, MaxLoad);

        result.IsValid.ShouldBeFalse();
        result.Messages.ShouldContain(m => m.Message.Contains("STEM"));
    }

    [Test]
    public async Task ValidateSemesterAsync_stem_course_satisfies_requirement()
    {
        var stemId = Guid.NewGuid();
        var (v, _) = await CreateValidator([
            MakeCourse(stemId, "Algorithms", Domain.Enums.CourseCategory.Stem, [1])
        ]);

        var result = await v.ValidateSemesterAsync([stemId], new(), 1, MaxLoad);

        result.Messages.ShouldNotContain(m => m.Level == "error" && m.Message.Contains("STEM"));
    }

    [Test]
    public async Task ValidateSemesterAsync_missing_soft_after_sem1_emits_error()
    {
        var stemId = Guid.NewGuid();
        var (v, _) = await CreateValidator([
            MakeCourse(stemId, "Algorithms", Domain.Enums.CourseCategory.Stem, [2])
        ]);

        var result = await v.ValidateSemesterAsync([stemId], new(), 2, MaxLoad);

        result.Messages.ShouldContain(m => m.Level == "error" && m.Message.Contains("Soft-курс"));
    }

    [Test]
    public async Task ValidateSemesterAsync_prerequisite_missing_emits_error()
    {
        var prereqId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var (v, _) = await CreateValidator(
            [MakeCourse(prereqId, "Intro", Domain.Enums.CourseCategory.Stem),
             MakeCourse(courseId, "Advanced", Domain.Enums.CourseCategory.Stem)],
            [
                new CourseDependency
                {
                    Id = Guid.NewGuid(), CourseId = courseId, RequiredCourseId = prereqId,
                    DependencyType = Domain.Enums.DependencyType.Prerequisite, AlternativeGroup = 0
                }
            ]);

        var result = await v.ValidateSemesterAsync([courseId], new(), 1, MaxLoad);

        result.IsValid.ShouldBeFalse();
        result.Messages.ShouldContain(m => m.Level == "error" && m.Message.Contains("пререквизит"));
    }

    [Test]
    public async Task ValidateSemesterAsync_prerequisite_satisfied_passes()
    {
        var prereqId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var (v, _) = await CreateValidator(
            [MakeCourse(prereqId, "Intro", Domain.Enums.CourseCategory.Stem),
             MakeCourse(courseId, "Advanced", Domain.Enums.CourseCategory.Stem)],
            [
                new CourseDependency
                {
                    Id = Guid.NewGuid(), CourseId = courseId, RequiredCourseId = prereqId,
                    DependencyType = Domain.Enums.DependencyType.Prerequisite, AlternativeGroup = 0
                }
            ]);

        var result = await v.ValidateSemesterAsync([courseId], new HashSet<Guid> { prereqId }, 2, MaxLoad);

        result.Messages.ShouldNotContain(m => m.Level == "error" && m.Message.Contains("пререквизит"));
    }

    [Test]
    public async Task ValidateSemesterAsync_missing_corequisite_emits_error()
    {
        var coreqId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var (v, _) = await CreateValidator(
            [MakeCourse(coreqId, "Lab", Domain.Enums.CourseCategory.Stem),
             MakeCourse(courseId, "Theory", Domain.Enums.CourseCategory.Stem)],
            [
                new CourseDependency
                {
                    Id = Guid.NewGuid(), CourseId = courseId, RequiredCourseId = coreqId,
                    DependencyType = Domain.Enums.DependencyType.Corequisite, AlternativeGroup = 0
                }
            ]);

        var result = await v.ValidateSemesterAsync([courseId], new(), 1, MaxLoad);

        result.Messages.ShouldContain(m => m.Level == "error" && m.Message.Contains("должны изучаться одновременно"));
    }

    [Test]
    public async Task ValidateSemesterAsync_corequisite_in_same_semester_passes()
    {
        var coreqId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var (v, _) = await CreateValidator(
            [MakeCourse(coreqId, "Lab", Domain.Enums.CourseCategory.Stem),
             MakeCourse(courseId, "Theory", Domain.Enums.CourseCategory.Stem)],
            [
                new CourseDependency
                {
                    Id = Guid.NewGuid(), CourseId = courseId, RequiredCourseId = coreqId,
                    DependencyType = Domain.Enums.DependencyType.Corequisite, AlternativeGroup = 0
                }
            ]);

        var result = await v.ValidateSemesterAsync([courseId, coreqId], new(), 1, MaxLoad);

        result.Messages.ShouldNotContain(m => m.Level == "error" && m.Message.Contains("должны изучаться одновременно"));
    }

    [Test]
    public async Task ValidateSemesterAsync_analog_group_satisfies_prerequisite()
    {
        var prereqId = Guid.NewGuid();
        var analogPrereqId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var (v, _) = await CreateValidator(
            [
                MakeCourse(prereqId, "Math1", Domain.Enums.CourseCategory.Stem, analogGroup: "MATH"),
                MakeCourse(analogPrereqId, "Math1-alt", Domain.Enums.CourseCategory.Stem, analogGroup: "MATH"),
                MakeCourse(courseId, "Math2", Domain.Enums.CourseCategory.Stem),
            ],
            [
                new CourseDependency
                {
                    Id = Guid.NewGuid(), CourseId = courseId, RequiredCourseId = prereqId,
                    DependencyType = Domain.Enums.DependencyType.Prerequisite, AlternativeGroup = 0
                }
            ]);

        var result = await v.ValidateSemesterAsync([courseId], new HashSet<Guid> { analogPrereqId }, 2, MaxLoad);

        result.Messages.ShouldNotContain(m => m.Level == "error" && m.Message.Contains("пререквизит"));
    }

    [Test]
    public async Task ValidateSemesterAsync_or_prerequisite_group_one_satisfied_passes()
    {
        var alt1 = Guid.NewGuid();
        var alt2 = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var (v, _) = await CreateValidator(
            [MakeCourse(alt1, "Alt1", Domain.Enums.CourseCategory.Stem),
             MakeCourse(alt2, "Alt2", Domain.Enums.CourseCategory.Stem),
             MakeCourse(courseId, "Course", Domain.Enums.CourseCategory.Stem)],
            [
                new CourseDependency
                {
                    Id = Guid.NewGuid(), CourseId = courseId, RequiredCourseId = alt1,
                    DependencyType = Domain.Enums.DependencyType.Prerequisite, AlternativeGroup = 1
                },
                new CourseDependency
                {
                    Id = Guid.NewGuid(), CourseId = courseId, RequiredCourseId = alt2,
                    DependencyType = Domain.Enums.DependencyType.Prerequisite, AlternativeGroup = 1
                }
            ]);

        var result = await v.ValidateSemesterAsync([courseId], new HashSet<Guid> { alt1 }, 2, MaxLoad);

        result.Messages.ShouldNotContain(m => m.Level == "error" && m.Message.Contains("пререквизит"));
    }

    [Test]
    public async Task ValidateSemesterAsync_no_required_courses_returns_valid()
    {
        var (v, _) = await CreateValidator([]);
        var result = await v.ValidateSemesterAsync([], new(), 1, MaxLoad);

        result.IsValid.ShouldBeTrue();
        result.TotalLoad.ShouldBe(0);
    }

    [Test]
    public async Task ValidateFullRoadmapAsync_validates_sequence()
    {
        var stemId = Guid.NewGuid();
        var stem2Id = Guid.NewGuid();
        var softId = Guid.NewGuid();
        var (v, _) = await CreateValidator([
            MakeCourse(stemId, "Stem", Domain.Enums.CourseCategory.Stem, [1]),
            MakeCourse(stem2Id, "Stem2", Domain.Enums.CourseCategory.Stem, [2]),
            MakeCourse(softId, "Soft", Domain.Enums.CourseCategory.Soft, [2]),
        ]);

        var roadmap = new List<SemesterData> { new(1, [stemId]), new(2, [stem2Id, softId]) };
        var result = await v.ValidateFullRoadmapAsync(roadmap, new(), MaxLoad, []);

        result.Count.ShouldBe(2);
        result.All(r => (bool)r["valid"]).ShouldBeTrue();
    }

    [Test]
    public async Task ValidateFullRoadmapAsync_detects_missing_required_courses()
    {
        var stemId = Guid.NewGuid();
        var requiredId = Guid.NewGuid();
        var (v, _) = await CreateValidator([
            MakeCourse(stemId, "Stem", Domain.Enums.CourseCategory.Stem, [1]),
            MakeCourse(requiredId, "Required", Domain.Enums.CourseCategory.Stem, [1]),
        ]);

        var roadmap = new List<SemesterData> { new(1, [stemId]) };
        var result = await v.ValidateFullRoadmapAsync(roadmap, new(), MaxLoad, new HashSet<Guid> { requiredId });

        result.Count.ShouldBe(1);
        ((bool)result[^1]["valid"]).ShouldBeFalse();
        var msgs = (List<Dictionary<string, object>>)result[^1]["messages"];
        msgs.ShouldContain(m => ((string)m["message"]).Contains("обязательный курс"));
    }

    [Test]
    public async Task ValidateFullRoadmapAsync_accumulates_passed_ids()
    {
        var stem1 = Guid.NewGuid();
        var stem2 = Guid.NewGuid();
        var soft2 = Guid.NewGuid();
        var (v, _) = await CreateValidator([
            MakeCourse(stem1, "S1", Domain.Enums.CourseCategory.Stem, [1]),
            MakeCourse(stem2, "S2", Domain.Enums.CourseCategory.Stem, [2]),
            MakeCourse(soft2, "Soft2", Domain.Enums.CourseCategory.Soft, [2]),
        ]);

        var roadmap = new List<SemesterData> { new(1, [stem1]), new(2, [stem2, soft2]) };
        var result = await v.ValidateFullRoadmapAsync(roadmap, new(), MaxLoad, []);

        result.Count.ShouldBe(2);
        result.All(r => (bool)r["valid"]).ShouldBeTrue();
    }

    [Test]
    public async Task ValidateFullRoadmapAsync_validates_sequence_with_soft()
    {
        var stemId = Guid.NewGuid();
        var stem2Id = Guid.NewGuid();
        var softId = Guid.NewGuid();
        var (v, _) = await CreateValidator([
            MakeCourse(stemId, "Stem", Domain.Enums.CourseCategory.Stem, [1]),
            MakeCourse(stem2Id, "Stem2", Domain.Enums.CourseCategory.Stem, [2]),
            MakeCourse(softId, "Soft", Domain.Enums.CourseCategory.Soft, [2]),
        ]);

        var roadmap = new List<SemesterData> { new(1, [stemId]), new(2, [stem2Id, softId]) };
        var result = await v.ValidateFullRoadmapAsync(roadmap, new(), MaxLoad, []);

        result.Count.ShouldBe(2);
        result.All(r => (bool)r["valid"]).ShouldBeTrue();
    }

    [Test]
    public async Task ValidateSemesterAsync_soft_requirement_skips_semester_one()
    {
        var stemId = Guid.NewGuid();
        var (v, _) = await CreateValidator([
            MakeCourse(stemId, "Algorithms", Domain.Enums.CourseCategory.Stem, [1])
        ]);

        var result = await v.ValidateSemesterAsync([stemId], new(), 1, MaxLoad);

        result.Messages.ShouldNotContain(m => m.Level == "error" && m.Message.Contains("Soft-курс"));
    }
}
