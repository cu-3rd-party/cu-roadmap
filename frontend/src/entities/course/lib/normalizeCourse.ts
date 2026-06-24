import type { CourseDto, CoursePrerequisiteDto } from "../api";
import type { Course, CoursePrerequisite } from "../model";

const sanitizeURL = (link: string | null | undefined): string => {
  if (!link) return "";
  try {
    return new URL(link).href;
  } catch {
    return "";
  }
};

export const normalizePrerequisite = (
  dto: CoursePrerequisiteDto,
): CoursePrerequisite => {
  return {
    courses: dto.course_ids,
    groupId: dto.group_id,
  };
};

export const normalizeCourse = (dto: CourseDto): Course => {
  return {
    id: dto.id,
    title: dto.title.trim(),
    description: dto.description?.trim() ?? null,
    type: dto.course_type,
    category: dto.category,
    handbookLink: sanitizeURL(dto.handbook_link),
    availableSemesters: dto.available_semesters,
    allowedCohorts: dto.allowed_cohorts,
    recommendedSemester: dto.recommended_semester,
    workload: dto.workload,
    prerequisites: dto.prerequisites
      ?.map((prereq) => normalizePrerequisite(prereq))
      .sort((item1, item2) => item1.courses.length - item2.courses.length),
    corequisites: dto.corequisites,
    postrequisites: dto.postrequisites,
    toMajor: dto.to_major,
    specializations: dto.specializations,
  };
};
