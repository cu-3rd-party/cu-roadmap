using CuRoadmap.Application.Common.Models;
using CuRoadmap.Application.Requirements;
using NUnit.Framework;
using Shouldly;

namespace CuRoadmap.Application.UnitTests.Requirements;

public class DependencyAnalyzerTests
{
    private static CourseData Course(Guid id, string title, string analogGroup = "",
        int[]? cohorts = null, int[]? semesters = null) =>
        new(id, title, null, null, Domain.Enums.CourseType.Mandatory, Domain.Enums.CourseCategory.Stem,
            cohorts ?? [], semesters ?? [], null, 5, 0, 0, analogGroup, null, [], [], []);

    private static CourseDependencyData Dep(Guid courseId, Guid reqId, Domain.Enums.DependencyType type, int group = 0) =>
        new(Guid.NewGuid(), courseId, reqId, type, group);

    [Test]
    public void CourseCovered_returns_true_if_passed()
    {
        var id = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData> { [id] = Course(id, "C") };
        var analyzer = new DependencyAnalyzer(courses, [], new HashSet<Guid> { id }, 0, 1, false);

        analyzer.CourseCovered(id).ShouldBeTrue();
    }

    [Test]
    public void CourseCovered_returns_true_if_analog_group_matches_passed()
    {
        var passedId = Guid.NewGuid();
        var targetId = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData>
        {
            [passedId] = Course(passedId, "Math-1", "MATH"),
            [targetId] = Course(targetId, "Math-2", "MATH"),
        };
        var analyzer = new DependencyAnalyzer(courses, [], new HashSet<Guid> { passedId }, 0, 1, false);

        analyzer.CourseCovered(targetId).ShouldBeTrue();
    }

    [Test]
    public void CourseCovered_returns_false_if_not_passed_and_no_analog()
    {
        var id = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData> { [id] = Course(id, "C") };
        var analyzer = new DependencyAnalyzer(courses, [], new(), 0, 1, false);

        analyzer.CourseCovered(id).ShouldBeFalse();
    }

    [Test]
    public void EarliestCompletionSemester_returns_0_if_already_passed()
    {
        var id = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData> { [id] = Course(id, "C") };
        var analyzer = new DependencyAnalyzer(courses, [], new HashSet<Guid> { id }, 0, 1, false);

        analyzer.EarliestCompletionSemester(id).ShouldBe(0);
    }

    [Test]
    public void EarliestCompletionSemester_returns_0_if_analog_passed()
    {
        var passedId = Guid.NewGuid();
        var targetId = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData>
        {
            [passedId] = Course(passedId, "A", "GRP"),
            [targetId] = Course(targetId, "B", "GRP"),
        };
        var analyzer = new DependencyAnalyzer(courses, [], new HashSet<Guid> { passedId }, 0, 1, false);

        analyzer.EarliestCompletionSemester(targetId).ShouldBe(0);
    }

    [Test]
    public void EarliestCompletionSemester_applies_cohort_filter()
    {
        var id = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData>
        {
            [id] = Course(id, "C", cohorts: [2020]),
        };
        var analyzer = new DependencyAnalyzer(courses, [], new(), 2021, 1, false);

        analyzer.EarliestCompletionSemester(id).ShouldBe(int.MaxValue);
    }

    [Test]
    public void EarliestCompletionSemester_ignores_cohort_filter_when_cohort_0()
    {
        var id = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData>
        {
            [id] = Course(id, "C", semesters: [1], cohorts: [2020]),
        };
        var analyzer = new DependencyAnalyzer(courses, [], new(), 0, 1, false);

        analyzer.EarliestCompletionSemester(id).ShouldBe(1);
    }

    [Test]
    public void EarliestCompletionSemester_returns_next_available_semester()
    {
        var id = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData>
        {
            [id] = Course(id, "C", semesters: [1, 2]),
        };
        var analyzer = new DependencyAnalyzer(courses, [], new(), 0, 1, false);

        analyzer.EarliestCompletionSemester(id).ShouldBe(1);
    }

    [Test]
    public void EarliestCompletionSemester_with_prerequisite()
    {
        var prereqId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData>
        {
            [prereqId] = Course(prereqId, "P", semesters: [1]),
            [courseId] = Course(courseId, "C", semesters: [2]),
        };
        var deps = new List<CourseDependencyData>
        {
            Dep(courseId, prereqId, Domain.Enums.DependencyType.Prerequisite),
        };
        var analyzer = new DependencyAnalyzer(courses, deps, new(), 0, 1, false);

        analyzer.EarliestCompletionSemester(courseId).ShouldBe(2);
    }

    [Test]
    public void EarliestCompletionSemester_with_or_group_picks_earliest()
    {
        var alt1 = Guid.NewGuid();
        var alt2 = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData>
        {
            [alt1] = Course(alt1, "A", semesters: [1]),
            [alt2] = Course(alt2, "B", semesters: [4]),
            [courseId] = Course(courseId, "C", semesters: [2]),
        };
        var deps = new List<CourseDependencyData>
        {
            Dep(courseId, alt1, Domain.Enums.DependencyType.Prerequisite, group: 1),
            Dep(courseId, alt2, Domain.Enums.DependencyType.Prerequisite, group: 1),
        };
        var analyzer = new DependencyAnalyzer(courses, deps, new(), 0, 1, false);

        analyzer.EarliestCompletionSemester(courseId).ShouldBe(2);
    }

    [Test]
    public void EarliestCompletionSemester_with_corequisite()
    {
        var coreqId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData>
        {
            [coreqId] = Course(coreqId, "C1", semesters: [3, 4]),
            [courseId] = Course(courseId, "C2", semesters: [3, 4]),
        };
        var deps = new List<CourseDependencyData>
        {
            Dep(courseId, coreqId, Domain.Enums.DependencyType.Corequisite),
        };
        var analyzer = new DependencyAnalyzer(courses, deps, new(), 0, 1, false);

        analyzer.EarliestCompletionSemester(courseId).ShouldBe(3);
    }

    [Test]
    public void EarliestCompletionSemester_returns_max_when_prereq_unavailable()
    {
        var prereqId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData>
        {
            [prereqId] = Course(prereqId, "P", cohorts: [9999]),
            [courseId] = Course(courseId, "C"),
        };
        var deps = new List<CourseDependencyData>
        {
            Dep(courseId, prereqId, Domain.Enums.DependencyType.Prerequisite),
        };
        var analyzer = new DependencyAnalyzer(courses, deps, new(), 2020, 1, false);

        analyzer.EarliestCompletionSemester(courseId).ShouldBe(int.MaxValue);
    }

    [Test]
    public void CategorizeCourseIds_returns_correct_partitions()
    {
        var coveredId = Guid.NewGuid();
        var canCoverId = Guid.NewGuid();
        var cannotCoverId = Guid.NewGuid();

        var courses = new Dictionary<Guid, CourseData>
        {
            [coveredId] = Course(coveredId, "Covered", semesters: [1]),
            [canCoverId] = Course(canCoverId, "Can", semesters: [2]),
            [cannotCoverId] = Course(cannotCoverId, "Cannot", cohorts: [9999]),
        };

        var analyzer = new DependencyAnalyzer(courses, [], new HashSet<Guid> { coveredId }, 2020, 1, false);

        var (covered, canCover, cannotCover) = analyzer.CategorizeCourseIds(new HashSet<Guid>
        {
            coveredId, canCoverId, cannotCoverId
        });

        covered.ShouldContain(coveredId.ToString());
        canCover.ShouldContain(canCoverId.ToString());
        cannotCover.ShouldContain(cannotCoverId.ToString());
    }

    [Test]
    public void OfferedInSemester_returns_true_when_no_semesters_configured()
    {
        var course = Course(Guid.NewGuid(), "C");
        DependencyAnalyzer.OfferedInSemester(course, 5).ShouldBeTrue();
    }

    [Test]
    public void OfferedInSemester_returns_true_when_semester_in_list()
    {
        var course = Course(Guid.NewGuid(), "C", semesters: [2, 4]);
        DependencyAnalyzer.OfferedInSemester(course, 2).ShouldBeTrue();
    }

    [Test]
    public void OfferedInSemester_returns_true_for_odd_semester_when_all_odd()
    {
        var course = Course(Guid.NewGuid(), "C", semesters: [1, 3]);
        DependencyAnalyzer.OfferedInSemester(course, 5).ShouldBeTrue();
        DependencyAnalyzer.OfferedInSemester(course, 2).ShouldBeFalse();
    }

    [Test]
    public void OfferedInSemester_returns_true_for_even_semester_when_all_even()
    {
        var course = Course(Guid.NewGuid(), "C", semesters: [2, 4]);
        DependencyAnalyzer.OfferedInSemester(course, 6).ShouldBeTrue();
        DependencyAnalyzer.OfferedInSemester(course, 3).ShouldBeFalse();
    }

    [Test]
    public void OfferedInSemester_returns_false_when_mixed_and_not_in_list()
    {
        var course = Course(Guid.NewGuid(), "C", semesters: [1, 4]);
        DependencyAnalyzer.OfferedInSemester(course, 3).ShouldBeFalse();
    }

    [Test]
    public void GroupCourseIdsByAnalog_groups_shared_analogs()
    {
        var id1 = Guid.NewGuid();
        var id2 = Guid.NewGuid();
        var id3 = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData>
        {
            [id1] = Course(id1, "A", "GRP"),
            [id2] = Course(id2, "B", "GRP"),
            [id3] = Course(id3, "C", ""),
        };
        var result = DependencyAnalyzer.GroupCourseIdsByAnalog(new HashSet<Guid> { id1, id2, id3 }, courses);

        result.Count.ShouldBe(2);
        var group = result.First(g => g.Count > 1);
        group.ShouldBe(new HashSet<Guid> { id1, id2 });
    }

    [Test]
    public void GroupCourseIdsByAnalog_returns_singletons_for_no_analog()
    {
        var id1 = Guid.NewGuid();
        var id2 = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData>
        {
            [id1] = Course(id1, "A"),
            [id2] = Course(id2, "B"),
        };
        var result = DependencyAnalyzer.GroupCourseIdsByAnalog(new HashSet<Guid> { id1, id2 }, courses);

        result.Count.ShouldBe(2);
        result.All(g => g.Count == 1).ShouldBeTrue();
    }

    [Test]
    public void CourseCanCover_returns_true_when_earliest_is_valid()
    {
        var id = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData> { [id] = Course(id, "C", semesters: [1]) };
        var analyzer = new DependencyAnalyzer(courses, [], new(), 0, 1, false);

        analyzer.CourseCanCover(id).ShouldBeTrue();
    }

    [Test]
    public void CourseCanCover_returns_false_when_earliest_is_max()
    {
        var id = Guid.NewGuid();
        var courses = new Dictionary<Guid, CourseData> { [id] = Course(id, "C", cohorts: [9999]) };
        var analyzer = new DependencyAnalyzer(courses, [], new(), 2020, 1, false);

        analyzer.CourseCanCover(id).ShouldBeFalse();
    }
}
