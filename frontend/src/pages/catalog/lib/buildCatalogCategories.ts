import { Course } from "@/entities/course";
import { CourseCategory, categorySlugToName } from "@/shared/model";

import { CatalogCategory } from "../model";

const CATEGORY_ORDER: CourseCategory[] = [
  "fundamentals",
  "ai",
  "business",
  "tech",
  "design",
  "stem",
  "soft",
];

const sortKey = (title: string) =>
  title.replace(/^[^а-яёА-ЯЁa-zA-Z]+/, "");

// Group normalized courses into the catalog category buckets (in display order)
export const buildCatalogCategories = (courses: Course[]): CatalogCategory[] =>
  CATEGORY_ORDER.map((id) => ({
    id,
    title: categorySlugToName[id],
    courses: courses
      .filter((course) => course.category === id)
      .sort((a, b) =>
        sortKey(a.title).localeCompare(sortKey(b.title), "ru"),
      ),
  }));
