import { Course } from "@/entities/course";
import {
  optionMatchesFilter,
  type CourseFilterState,
} from "@/features/course-filters";

import type { CatalogCategory } from "./category";

// Within a section, courses are narrowed by semester + search only. The chip
// selection picks which sections show; the standalone type filter is ignored.
const matchesSemesterSearch = (course: Course, filters: CourseFilterState) => {
  const semesterOk =
    filters.semesters.length === 0 ||
    (course.recommendedSemester != null &&
      filters.semesters.includes(String(course.recommendedSemester)));

  const query = filters.search.trim().toLowerCase();
  const searchOk =
    query.length === 0 ||
    course.title.toLowerCase().includes(query) ||
    (course.description?.toLowerCase().includes(query) ?? false);

  return semesterOk && searchOk;
};

// Show the sections selected by the (group, sub) filter, each narrowed by
// semester + search. A section disappears once it becomes empty.
export const filterCatalog = (
  categories: CatalogCategory[],
  filters: CourseFilterState,
): CatalogCategory[] =>
  categories
    .filter((category) =>
      optionMatchesFilter(category.option, filters.group, filters.sub),
    )
    .map((category) => ({
      ...category,
      courses: category.courses.filter((course) =>
        matchesSemesterSearch(course, filters),
      ),
    }))
    .filter((category) => category.courses.length > 0);
