import { createCourseFiltersStore } from "@/features/course-filters";

// One of two stores for filtration
export const useCatalogFiltersStore = createCourseFiltersStore({
  persistKey: "catalog-course-filters",
});
