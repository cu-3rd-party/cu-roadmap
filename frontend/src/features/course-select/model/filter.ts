import type { Course } from "@/entities/course";
import {
  courseMatchesOption,
  optionMatchesFilter,
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

// Filter modal courses by the (group, sub) selection and the search query.
export const filterAvailableCourses = (
  courses: Course[],
  filters: CourseFilterState,
  options: CategoryFilterOption[],
): Course[] => {
  const visibleOptions = options.filter((option) =>
    optionMatchesFilter(option, filters.group, filters.sub),
  );

  return courses.filter(
    (course) =>
      visibleOptions.some((option) => courseMatchesOption(course, option)) &&
      matchesSearch(course, filters.search),
  );
};
