import type { CourseDto } from "../api";
import type { Course } from "../model";

const sanitizeURL = (link: string | null | undefined): string => {
  if (!link) return "";
  try {
    return new URL(link).href;
  } catch {
    return ""
  }
}

export const normalizeCourse = (dto: CourseDto): Course => {
  return {
    id: dto.id, 
    title: dto.title,
    description: dto.description,
    courseType: dto.course_type,
    category: dto.category,
    handbookLink: sanitizeURL(dto.handbook_link),
    availableSemesters: dto.available_semesters,
    allowedCohorts: dto.allowed_cohorts,
    recommendedSemester: dto.recommended_semester,
    workload: dto.workload,
    prerequisites: dto.prerequisites,
    corequisites: dto.corequisites,
    toMajor: dto.to_major
  }
};
