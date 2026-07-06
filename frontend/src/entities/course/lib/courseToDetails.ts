import type { SemesterNumber } from "@/shared/constants";
import { pluralizeRu } from "@/shared/lib";
import { categorySlugToName, typeSlugToName, type UUID } from "@/shared/model";

import type {
  CourseDetails,
  PrerequisiteGroupItem,
  RequisiteItem,
  Season,
  SpecializationItem,
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

const buildAcademicLoad = (course: Course): string[] => {
  const lines: string[] = [];
  if (course.lecturesWeek && course.lecturesWeek > 0)
    lines.push(
      `${course.lecturesWeek} ${pluralizeRu(course.lecturesWeek, ["лекция", "лекции", "лекций"])} в неделю`,
    );
  if (course.seminarsWeek && course.seminarsWeek > 0)
    lines.push(
      `${course.seminarsWeek} ${pluralizeRu(course.seminarsWeek, ["семинар", "семинара", "семинаров"])} в неделю`,
    );
  return lines;
};

interface CourseToDetailsLookups {
  titleMap: Map<UUID, string>;
  specializationTitleMap: Map<UUID, string>;
}

// Map a normalized Course into the CourseDetails shape the drawer renders
export const courseToDetails = (
  course: Course,
  { titleMap, specializationTitleMap }: CourseToDetailsLookups,
): CourseDetails => {
  const mandatorySet = new Set(course.mandatorySpecializations ?? []);
  return {
    title: course.title,
    description: course.description,
    syllabus: course.handbookLink,
    admissionYears: formatAdmissionYears(course.allowedCohorts),
    category: ["core", "choice"].includes(course.type)
      ? `${categorySlugToName[course.category]} ${typeSlugToName[course.type]}`
      : categorySlugToName[course.category],
    isCore: course.type === "core",
    specializations: (course.specializations ?? [])
      .map((id) => {
        const title = specializationTitleMap.get(id);
        return title ? { title, mandatory: mandatorySet.has(id) } : null;
      })
      .filter((item): item is SpecializationItem => item !== null),
    seasons: semestersToSeasons(course.availableSemesters),
    availableSemesters: course.availableSemesters.map((semester) => ({
      label: `${semester} семестр`,
      recommended: semester === course.recommendedSemester,
    })),
    academicLoad: buildAcademicLoad(course),
    prerequisites: resolvePrerequisites(course.prerequisites, titleMap),
    postrequisites: resolveRequisites(course.postrequisites, titleMap),
    corequisites: resolveRequisites(course.corequisites, titleMap),
  };
};
