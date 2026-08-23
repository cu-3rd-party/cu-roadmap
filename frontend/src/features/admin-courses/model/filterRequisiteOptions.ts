import type { Course } from "@/entities/course";
import type { UUID } from "@/shared/model";

const matches = (haystack: string | null | undefined, query: string) =>
  (haystack ?? "").toLowerCase().includes(query);

/* Search for the requisite picker. Kept as plain functions so the matching rules
   are testable without mounting the modal.

   The group-side counterpart lives in `entities/disciplineGroup` — the admin
   Коробки grid searches groups too, and a feature may not import from another
   feature. */
export const filterCoursesBySearch = (
  courses: Course[],
  search: string,
  excludeId?: UUID,
): Course[] => {
  const query = search.trim().toLowerCase();
  return courses.filter(
    (course) =>
      // A course can never be its own prerequisite.
      course.id !== excludeId &&
      (query.length === 0 ||
        matches(course.title, query) ||
        matches(course.description, query)),
  );
};
