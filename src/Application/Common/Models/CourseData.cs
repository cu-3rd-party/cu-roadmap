namespace CuRoadmap.Application.Common.Models;

public record CourseData(
    Guid Id,
    string Title,
    string? Description,
    string? HandbookLink,
    Domain.Enums.CourseType CourseType,
    Domain.Enums.CourseCategory Category,
    int[] AllowedCohorts,
    int[] AvailableSemesters,
    int? RecommendedSemester,
    double Workload,
    int SeminarsWeek,
    int LecturesWeek,
    string AnalogGroup,
    double? CsatMetric,
    List<Guid> Prerequisites,
    List<Guid> Corequisites,
    List<Guid> Postrequisites);

public record CourseDependencyData(
    Guid Id,
    Guid CourseId,
    Guid RequiredCourseId,
    Domain.Enums.DependencyType DependencyType,
    int AlternativeGroup);

public record MajorData(
    Guid Id,
    string Title,
    string School,
    int CohortYear,
    Guid? RequirementsBoxId);

public record SpecializationData(
    Guid Id,
    Guid MajorId,
    string Title,
    Guid? RequirementsBoxId);

public record BoxData(
    Guid Id,
    Domain.Enums.BoxKind Kind,
    string Title,
    Guid? CourseId,
    Domain.Enums.LogicalOp? LogicalOp,
    int RequiredCount,
    Domain.Enums.RequirementType? RequirementType,
    string[] Specializations,
    string[] MandatorySpecializations,
    int? AdmissionYear,
    string? MajorTrack);

public record BoxEdgeData(
    Guid Id,
    Guid ParentBoxId,
    Guid ChildBoxId,
    int Position);

public record StudentData(
    Guid Id,
    int Cohort,
    int CurrentSemester,
    Guid? TargetMajorId,
    List<Guid> PassedCourseIds);
