import type { Course } from "@/entities/course";
import type { DisciplineGroup } from "@/entities/disciplineGroup";
import type { UUID } from "@/shared/model";

const matches = (haystack: string | null | undefined, query: string) =>
  (haystack ?? "").toLowerCase().includes(query);

/* Search for the requisite picker. Kept as plain functions so the matching rules
   are testable without mounting the modal. */
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

export const filterGroupsBySearch = (
  groups: DisciplineGroup[],
  search: string,
): DisciplineGroup[] => {
  const query = search.trim().toLowerCase();
  if (query.length === 0) return groups;
  return groups.filter((group) => matches(group.title, query));
};
