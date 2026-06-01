import type {
  CategoryFilterOption,
  CourseFilterState,
} from "@/features/course-filters";

import type { CatalogCategory, CatalogCourse } from "./mock";

/**
 * Card-level match: year + major + search. Each group is OR within itself and
 * AND across groups. An empty group means "no constraint".
 */
const matchesCourse = (course: CatalogCourse, filters: CourseFilterState) => {
  const yearOk =
    filters.years.length === 0 || filters.years.includes(course.year);
  const majorOk =
    filters.majors.length === 0 || filters.majors.includes(course.major);

  const query = filters.search.trim().toLowerCase();
  const searchOk =
    query.length === 0 ||
    course.title.toLowerCase().includes(query) ||
    (course.description?.toLowerCase().includes(query) ?? false);

  return yearOk && majorOk && searchOk;
};

/**
 * Apply all filters to the catalog:
 * 1. type chips (`categories`) hide whole blocks,
 * 2. year/major/search filter cards inside the remaining blocks,
 * 3. blocks left with zero matching cards are dropped.
 */
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

/**
 * Type-chip options with a live count of cards matching the current
 * year/major/search filters (independent of the type selection itself).
 */
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
