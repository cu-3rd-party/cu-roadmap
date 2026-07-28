namespace CuRoadmap.Application.Common.Models;

public record FlatRequirementInput(
    Guid Id,
    Guid CourseId,
    Domain.Enums.RequirementType RequirementType,
    string[] Specializations,
    string[] MandatorySpecializations);
