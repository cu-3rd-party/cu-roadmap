import type { SpecializationDto, SpecializationMatchDto } from "../api";
import type {
  Specialization,
  SpecializationMatch,
  SpecializationMatchCourse,
} from "../model";

const normalizeSpecializationMatchCourse = (
  dto: SpecializationMatchDto["covered_courses"][number],
): SpecializationMatchCourse => {
  return {
    courseId: dto.course_id,
    title: dto.title,
  };
};

export const normalizeSpecialization = (
  dto: SpecializationDto,
): Specialization => {
  return {
    id: dto.id,
    majorId: dto.major_id,
    title: dto.title,
  };
};

export const normalizeSpecializationMatch = (
  dto: SpecializationMatchDto,
): SpecializationMatch => {
  return {
    id: dto.id,
    majorId: dto.major_id,
    title: dto.title,
    cohortYear: dto.cohort_year,
    score: dto.score,
    coveredCount: dto.covered_count,
    canCoverCount: dto.can_cover_count,
    totalCount: dto.total_count,
    coveredCourses: dto.covered_courses.map(normalizeSpecializationMatchCourse),
    canCoverCourses: dto.can_cover_courses.map(
      normalizeSpecializationMatchCourse,
    ),
    cannotCoverCourses: dto.cannot_cover_courses.map(
      normalizeSpecializationMatchCourse,
    ),
  };
};
