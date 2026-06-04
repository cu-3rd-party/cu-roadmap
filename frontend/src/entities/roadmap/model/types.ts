import type { CourseCategory, CourseType } from "@/shared/model";

export interface PlannedCourse {
  id: string;
  title: string;
  // badge labels carried over when a course is added to a semester
  category?: CourseCategory;
  type?: CourseType;
  // derived (not persisted): true when the course sits in a completed semester
  completed?: boolean;
}
