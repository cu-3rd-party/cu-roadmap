import type { CourseCategory } from "@/shared/model";

/* Russian labels for the "Тип" filter row. `categorySlugToName` is the English
   display map used on course cards ("AI", "SWE", "Business"); the admin filter
   spells the same categories out in Russian, so it needs its own map. */
export const CATEGORY_FILTER_LABELS: Record<CourseCategory, string> = {
  ai: "ИИ",
  swe: "Разработка",
  business: "Бизнес",
  stem: "STEM",
  soft: "SOFT",
  fundamentals: "Fundamentals",
  design: "Design",
};

export const CATEGORY_FILTER_OPTIONS = Object.keys(
  CATEGORY_FILTER_LABELS,
) as CourseCategory[];
