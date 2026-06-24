import type { Course } from "@/entities/course";
import {
  courseMatchesOption,
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

// Filter modal courses by search (title/description) and the combined chips
export const filterAvailableCourses = (
  courses: Course[],
  filters: CourseFilterState,
  options: CategoryFilterOption[],
): Course[] => {
  const selectedOptions = options.filter((option) =>
    filters.categories.includes(option.id),
  );

  return courses.filter((course) => {
    const categoryOk =
      selectedOptions.length === 0 ||
      selectedOptions.some((option) => courseMatchesOption(course, option));

    return categoryOk && matchesSearch(course, filters.search);
  });
};

// Chip options with a live count of courses matching the current search
export const availableCategoryOptions = (
  courses: Course[],
  filters: CourseFilterState,
  options: CategoryFilterOption[],
): CategoryFilterOption[] =>
  options.map((option) => ({
    ...option,
    count: courses.filter(
      (course) =>
        courseMatchesOption(course, option) &&
        matchesSearch(course, filters.search),
    ).length,
  }));
