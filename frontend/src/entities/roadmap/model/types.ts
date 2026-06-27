import type { CourseCategory, CourseType } from "@/shared/model";

export interface PlannedCourse {
  id: string;
  title: string;
  // badge labels carried over when a course is added to a semester
  category?: CourseCategory;
  type?: CourseType;
  // derived (not persisted): true when the course sits in a completed semester
  completed?: boolean;
  // true when the course is pinned to this semester by its fixed_semester.
  // Fixed courses can't be moved, removed, deselected, or cleared by resets, can only be moved inside semester
  fixed?: boolean;
}

// Catalog snapshot the planner passes to `resyncSelections` to refresh placed
// courses. Decoupled from the `Course` type so the store stays independent of
// the course entity. `fixedSemester`: 0 = not fixed, 1-8 = pinned semester.
export interface CourseCatalogInfo {
  id: string;
  title: string;
  category?: CourseCategory;
  type?: CourseType;
  fixedSemester: number;
}
