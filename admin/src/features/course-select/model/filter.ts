import type { Course } from "@/entities/course";
import {
  buildCategoryFilters,
  type CategoryFilterOption,
  type CourseFilterState,
} from "@/features/course-filters";

const matchesSearch = (course: Course, search: string) => {
  const query = search.trim().toLowerCase();
  if (query.length === 0) return true;
  return (
    course.title.toLowerCase().includes(query) ||
    (course.description?.toLowerCase().includes(query) ?? false)
  );
};

// Filter modal courses by search (title/description) and category chips
export const filterAvailableCourses = (
  courses: Course[],
  filters: CourseFilterState,
): Course[] =>
  courses.filter((course) => {
    const categoryOk =
      filters.categories.length === 0 ||
      filters.categories.includes(course.category);

    return categoryOk && matchesSearch(course, filters.search);
  });

// Category chip options with a live count of courses matching the current search
export const availableCategoryOptions = (
  courses: Course[],
  filters: CourseFilterState,
): CategoryFilterOption[] =>
  buildCategoryFilters().map((option) => ({
    ...option,
    count: courses.filter(
      (course) =>
        course.category === option.id && matchesSearch(course, filters.search),
    ).length,
  }));
