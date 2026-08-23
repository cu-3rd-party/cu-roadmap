import type { CourseCategory } from "@/shared/model";

/* Russian labels for the admin "Тип" row — the filter chips and the type badge
   on the course card read from the same map, so a chip and the cards it selects
   always spell the category the same way.
  */
export const CATEGORY_FILTER_LABELS: Record<CourseCategory, string> = {
  ai: "ИИ",
  swe: "Разработка",
  business: "Бизнес",
  design: "Дизайн",
  stem: "STEM",
  soft: "SOFT",
  fundamentals: "Другое",
};

/* Explicit rather than Object.keys(CATEGORY_FILTER_LABELS): chip order is a
   design decision, and deriving it from the label map means an unrelated edit
   there silently reshuffles the filter row. */
export const CATEGORY_FILTER_OPTIONS: CourseCategory[] = [
  "ai",
  "swe",
  "business",
  "design",
  "stem",
  "soft",
  "fundamentals",
];
