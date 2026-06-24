export type UUID = string;

export type CourseType = "core" | "choice" | "elective" | "other";

export const typeSlugToName: Record<CourseType, string> = {
  core: "Core",
  choice: "Choice",
  elective: "Факультатив",
  other: "Other",
};

/* 
export const typeSlugToShortName: Record<CourseType, string> = {
  core: "Core",
  choice: "Choice",
  elective: "Elective",
  other: "Other",
};
*/

export type CourseCategory =
  | "fundamentals"
  | "ai"
  | "stem"
  | "soft"
  | "business"
  | "swe"
  | "design";

export const categorySlugToName: Record<CourseCategory, string> = {
  fundamentals: "Fundamentals",
  ai: "AI",
  business: "Business",
  swe: "SWE",
  design: "Design",
  stem: "STEM",
  soft: "Soft",
};

export const categorySlugToShortName: Record<CourseCategory, string> = {
  fundamentals: "Fund.",
  ai: "AI",
  business: "Business",
  swe: "SWE",
  design: "Design",
  stem: "STEM",
  soft: "Soft",
};

export type MajorRequirementType =
  | "major_core"
  | "major_choice"
  | "flex"
  | "university"
  | "elective"
  | "minor"
  | "soft"
  | "selected_topics";

export const MAJOR_TYPES = ["business", "swe", "ai"] as const;

export type MajorType = (typeof MAJOR_TYPES)[number];

export const OTHER_CATEGORIES: CourseCategory[] = [
  "fundamentals",
  "stem",
  "soft",
];
