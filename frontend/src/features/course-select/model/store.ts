import { createCourseFiltersStore } from "@/features/course-filters";

/** Modal filter state — independent from the catalog, not persisted (transient). */
export const useCourseSelectFiltersStore = createCourseFiltersStore();
