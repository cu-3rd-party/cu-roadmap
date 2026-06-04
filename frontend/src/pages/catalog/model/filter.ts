import { Course } from "@/entities/course";
import type {
  CategoryFilterOption,
  CourseFilterState,
} from "@/features/course-filters";

import type { CatalogCategory } from "./category";

// Card-level match: type + major + search.
const matchesCourse = (course: Course, filters: CourseFilterState) => {
  const typeOk =
    filters.types.length === 0 || filters.types.includes(course.type);

  // TODO
  const majorOk = true;

  const query = filters.search.trim().toLowerCase();
  const searchOk =
    query.length === 0 ||
    course.title.toLowerCase().includes(query) ||
    (course.description?.toLowerCase().includes(query) ?? false);

  return typeOk && majorOk && searchOk;
};

// Apply all filters to all catalogs, if catalog is not included in catalog filters or becomes empty after inside filtration - the whole block will not show up
export const filterCatalog = (
  categories: CatalogCategory[],
  filters: CourseFilterState,
): CatalogCategory[] =>
  categories
    .filter(
      (category) =>
        filters.categories.length === 0 ||
        filters.categories.includes(category.id),
    )
    .map((category) => ({
      ...category,
      courses: category.courses.filter((course) =>
        matchesCourse(course, filters),
      ),
    }))
    .filter((category) => category.courses.length > 0);

// Map each category to the amount of filtrated courses in it
export const categoryOptionsWithCounts = (
  categories: CatalogCategory[],
  filters: CourseFilterState,
): CategoryFilterOption[] =>
  categories.map((category) => ({
    id: category.id,
    label: category.title,
    count: category.courses.filter((course) => matchesCourse(course, filters))
      .length,
  }));
