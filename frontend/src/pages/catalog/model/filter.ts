import { Course } from "@/entities/course";
import {
  optionMatchesFilter,
  type CourseFilterState,
} from "@/features/course-filters";

import type { CatalogCategory } from "./category";

// Within a section, courses are narrowed by available/recommended semester,
// workload and search. The chip selection picks which sections show.
const matchesSemesterSearch = (course: Course, filters: CourseFilterState) => {
  const availableOk =
    filters.availableSemesters.length === 0 ||
    course.availableSemesters.some((semester) =>
      filters.availableSemesters.includes(String(semester)),
    );

  const semesterOk =
    filters.semesters.length === 0 ||
    (course.recommendedSemester != null &&
      filters.semesters.includes(String(course.recommendedSemester)));

  // "4" is a "4+" bucket (matches workload >= 4); the rest match exactly.
  const workloadOk =
    filters.workload.length === 0 ||
    filters.workload.some((w) =>
      w === "4" ? course.workload >= 4 : course.workload === Number(w),
    );

  const query = filters.search.trim().toLowerCase();
  const searchOk =
    query.length === 0 ||
    course.title.toLowerCase().includes(query) ||
    (course.description?.toLowerCase().includes(query) ?? false);

  return availableOk && semesterOk && workloadOk && searchOk;
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
