import type { SemesterNumber } from "@/shared/constants";
import { categorySlugToName, typeSlugToName, type UUID } from "@/shared/model";

import type {
  CourseDetails,
  PrerequisiteGroupItem,
  RequisiteItem,
  Season,
} from "../model/details";
import type { Course, CoursePrerequisite } from "../model/types";

export const buildCourseTitleMap = (courses: Course[]): Map<UUID, string> =>
  new Map(courses.map((course) => [course.id, course.title]));

export const semestersToSeasons = (
  semesters: SemesterNumber[] | undefined,
): Season[] => {
  const seasons = new Set<Season>();
  for (const semester of semesters ?? []) {
    seasons.add(semester % 2 === 1 ? "autumn" : "spring");
  }
  return [...seasons];
};

const formatAdmissionYears = (years: number[] | undefined): string => {
  if (!years || years.length === 0) return "Не указан";
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? `${min}` : `${min}–${max}`;
};

const resolveRequisites = (
  ids: UUID[] | undefined,
  titleMap: Map<UUID, string>,
): RequisiteItem[] =>
  (ids ?? [])
    .map((id) => ({ id, title: titleMap.get(id) }))
    .filter((item): item is RequisiteItem => Boolean(item.title));

const resolvePrerequisites = (
  groups: CoursePrerequisite[] | undefined,
  titleMap: Map<UUID, string>,
): PrerequisiteGroupItem[] =>
  (groups ?? [])
    .map((group) => ({
      groupId: group.groupId,
      prerequisites: resolveRequisites(group.courses, titleMap),
    }))
    .filter((group) => group.prerequisites.length > 0);

interface CourseToDetailsLookups {
  titleMap: Map<UUID, string>;
  specializationTitleMap: Map<UUID, string>;
}

// Map a normalized Course into the CourseDetails shape the drawer renders
export const courseToDetails = (
  course: Course,
  { titleMap, specializationTitleMap }: CourseToDetailsLookups,
): CourseDetails => ({
  title: course.title,
  description: course.description,
  syllabus: course.handbookLink,
  admissionYears: formatAdmissionYears(course.allowedCohorts),
  category: ["core", "choice"].includes(course.type)
    ? `${categorySlugToName[course.category]} ${typeSlugToName[course.type]}`
    : categorySlugToName[course.category],
  specializations: (course.specializations ?? [])
    .map((id) => specializationTitleMap.get(id))
    .filter((title): title is string => Boolean(title)),
  seasons: semestersToSeasons(course.availableSemesters),
  recommendedSemester: course.recommendedSemester
    ? `${course.recommendedSemester} семестр`
    : "Не указан",
  prerequisites: resolvePrerequisites(course.prerequisites, titleMap),
  postrequisites: resolveRequisites(course.postrequisites, titleMap),
  corequisites: resolveRequisites(course.corequisites, titleMap),
});
