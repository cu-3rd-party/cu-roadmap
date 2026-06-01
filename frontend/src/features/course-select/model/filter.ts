import {
  CATEGORY_FILTERS,
  type CategoryFilterOption,
  type CourseFilterState,
} from "@/features/course-filters";

import type { AvailableCourse } from "./courses";

const matchesSearch = (course: AvailableCourse, search: string) => {
  const query = search.trim().toLowerCase();
  if (query.length === 0) return true;
  return (
    course.title.toLowerCase().includes(query) ||
    (course.description?.toLowerCase().includes(query) ?? false)
  );
};

/** Filter modal courses by search (title/description) and category chips. */
export const filterAvailableCourses = (
  courses: AvailableCourse[],
  filters: CourseFilterState,
): AvailableCourse[] =>
  courses.filter((course) => {
    const categoryOk =
      filters.categories.length === 0 ||
      filters.categories.includes(course.category);

    return categoryOk && matchesSearch(course, filters.search);
  });

/**
 * Category chip options with a live count of courses matching the current
 * search (mirrors the catalog chips; ignores the category selection itself).
 */
export const availableCategoryOptions = (
  courses: AvailableCourse[],
  filters: CourseFilterState,
): CategoryFilterOption[] =>
  CATEGORY_FILTERS.map((option) => ({
    ...option,
    count: courses.filter(
      (course) =>
        course.category === option.id && matchesSearch(course, filters.search),
    ).length,
  }));
