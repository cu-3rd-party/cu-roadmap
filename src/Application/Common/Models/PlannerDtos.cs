namespace CuRoadmap.Application.Common.Models;

public record PlannerRequest(
    List<Guid> PassedCourseIds,
    List<PlannedSemester> SelectedCourseIds,
    Domain.Enums.CourseSource CourseSource,
    Guid MajorId,
    Guid? SpecializationId,
    int CurrentSemester,
    double MaxLoad,
    int Cohort);

public record PlannedSemester(
    int Semester,
    List<Guid> CourseIds);

public record SemesterValidationRequest(
    int CurrentSemester,
    List<Guid> CourseIds,
    List<Guid> PassedCourseIds,
    double MaxLoad);

public record RoadmapValidationRequest(
    List<SemesterData> Roadmap,
    double MaxLoad,
    int CurrentSemester,
    Guid? MajorId,
    Guid? SpecializationId);

public record SemesterData(
    int Semester,
    List<Guid> CourseIds);

public record ValidationMessage(
    string Level,
    string Message,
    Guid? CourseId);

public record ValidationResult(
    bool IsValid,
    List<ValidationMessage> Messages,
    double TotalLoad);

public record GoalPathRequest(
    Guid TargetCourseId,
    List<Guid> PassedCourseIds,
    int CurrentSemester,
    double MaxLoad,
    int? GoalSemester);

public record CreateCourseRequest(
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
    List<string> Prerequisites,
    List<string> Corequisites);

public record UpdateCourseRequest(
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
    List<string> Prerequisites,
    List<string> Corequisites);

public record CreateMajorRequest(
    string Title,
    string School,
    List<MajorRequirementItem> Requirements);

public record UpdateMajorRequest(
    string Title,
    string School,
    List<MajorRequirementItem> Requirements);

public record MajorRequirementItem(
    string CourseId,
    string Type);

public record CourseFilter(
    int[] CohortYears,
    string Title,
    Domain.Enums.CourseType[] CourseTypes,
    Domain.Enums.CourseCategory[] Categories,
    string WorkloadOp,
    double WorkloadVal);
