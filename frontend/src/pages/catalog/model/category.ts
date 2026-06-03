import { Course } from "@/entities/course";
import { CourseCategory } from "@/shared/model";

export interface CatalogCategory {
  id: CourseCategory;
  title: string;
  courses: Course[];
}