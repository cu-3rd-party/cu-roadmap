import { Course } from "@/entities/course";
import { CourseCategory } from "@/shared/model";

export interface CatalogCategory {
  id: CourseCategory;
  title: string;
  courses: Course[];
}

export const categoryToDescription: Record<CourseCategory, string> = {
  fundamentals: "Курсы, которые проводятся для всех направлений",
  ai: "Курсы мейджора Artificial Intelligence",
  business: "Курсы мейджора Business",
  tech: "Курсы мейджора Software Engineering",
  design: "Курсы мейджора Design",
  stem: "STEM курсы",
  soft: "Soft курсы",
};
