import { Course } from "@/entities/course";
import type {
  CategoryFilterOption,
  CourseFilterState,
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

// Show the selected sections (or all when none selected), narrowed by
// semester + search. A section disappears once it becomes empty.
export const filterCatalog = (
  categories: CatalogCategory[],
  filters: CourseFilterState,
): CatalogCategory[] =>
  categories
    .filter(
      (category) =>
        filters.categories.length === 0 ||
        filters.categories.includes(category.option.id),
    )
    .map((category) => ({
      ...category,
      courses: category.courses.filter((course) =>
        matchesSemesterSearch(course, filters),
      ),
    }))
    .filter((category) => category.courses.length > 0);

// Chip options with a live count of courses matching the current
// semester + search filters within each section.
export const categoryOptionsWithCounts = (
  categories: CatalogCategory[],
  filters: CourseFilterState,
): CategoryFilterOption[] =>
  categories.map((category) => ({
    ...category.option,
    count: category.courses.filter((course) =>
      matchesSemesterSearch(course, filters),
    ).length,
  }));
