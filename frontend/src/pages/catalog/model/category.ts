import { Course } from "@/entities/course";
import type { CategoryFilterOption } from "@/features/course-filters";
import { CourseCategory } from "@/shared/model";

export interface CatalogCategory {
  option: CategoryFilterOption;
  courses: Course[];
}

export const categoryToDescription: Record<CourseCategory, string> = {
  fundamentals: "Курсы, которые проводятся для всех направлений",
  ai: "Курсы мейджора Artificial Intelligence",
  business: "Курсы мейджора Business",
  swe: "Курсы мейджора Software Engineering",
  design: "Курсы мейджора Design",
  stem: "STEM курсы",
  soft: "Soft курсы",
};

// Subtitle shown in a catalog section's collapsible panel.
export const optionDescription = (
  option: CategoryFilterOption,
): string | undefined => {
  if (option.type === "core") return "Обязательные курсы мейджора";
  if (option.type === "choice") return "Курсы выбранной специализации";
  if (option.category) return categoryToDescription[option.category];
  return undefined;
};
