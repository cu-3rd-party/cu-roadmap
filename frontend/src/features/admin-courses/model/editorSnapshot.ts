import type { Course, CourseDependency } from "@/entities/course";
import { ADMISSION_YEARS } from "@/shared/constants";

import { CATEGORY_FILTER_OPTIONS } from "./labels";

/* The editable scalar fields of the course editor, as the controls hold them
   (strings, because that is what Tabs and Select speak). */
export interface CourseEditorFields {
  title: string;
  description: string;
  year: string;
  courseType: string;
  semesters: string[];
  lecturesWeek: string;
  seminarsWeek: string;
}

/* Single source of truth for "what the course looks like in the editor". Both
   the seeding effect and the dirty check go through this, so the two cannot
   drift — which is what makes comparing them meaningful. */
export const courseToEditorFields = (course: Course): CourseEditorFields => ({
  title: course.title,
  description: course.description ?? "",
  /* Год and Тип track the course rather than defaulting to the first option,
     or they would read as changed the moment it loads. */
  year: String(course.allowedCohorts?.[0] ?? ADMISSION_YEARS[0]),
  courseType: course.category ?? CATEGORY_FILTER_OPTIONS[0],
  semesters: course.availableSemesters?.map(String) ?? [],
  lecturesWeek: String(course.lecturesWeek ?? 0),
  seminarsWeek: String(course.seminarsWeek ?? 0),
});

const requisiteSignature = (row: CourseDependency) =>
  [
    row.type,
    row.requiredCourseId ?? "",
    row.requiredGroupId ?? "",
    row.alternativeGroup,
  ].join("|");

/* A comparable string for the whole editor. Sorted so that reordering alone —
   re-adding a requisite, toggling a semester off and on — is not a change. */
export const editorSnapshotKey = (
  fields: CourseEditorFields,
  dependencies: CourseDependency[],
): string =>
  JSON.stringify({
    ...fields,
    semesters: [...fields.semesters].sort(),
    requisites: dependencies.map(requisiteSignature).sort(),
  });
