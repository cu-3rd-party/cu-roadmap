import type { Course } from "@/entities/course";
import { SEMESTER_NUMBERS } from "@/shared/constants";
import type { SemesterNumber } from "@/shared/constants";

/*
 Semesters offered for the chosen course, kept at/after the cohort's current
 semester. No course picked -> no options (only "Любой" is shown).
*/
export const getSemesterOptions = (
  courses: Course[] | undefined,
  courseId: string,
  minSemester: number,
): SemesterNumber[] => {
  const selected = courses?.find((course) => course.id === courseId);
  if (!selected) return [];
  return SEMESTER_NUMBERS.filter(
    (s) => s >= minSemester && selected.availableSemesters.includes(s),
  );
};
