export type UUID = string;

export type CourseType = "core" | "choice" | "elective" | "flex" | "other";

export const typeSlugToName: Record<CourseType, string> = {
  core: "Core",
  choice: "Choice",
  elective: "Факультативы",
  flex: "Flex",
  other: "Другое",
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
  "fundamentals" | "ai" | "stem" | "soft" | "business" | "swe" | "design";

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

// Ids of the glossary entries (GLOSSARY_ENTRIES). Used as the URL hash the
// glossary page opens from (e.g. /glossary#core) and to type GlossaryLink.
export const GLOSSARY_IDS = [
  "fundamentals",
  "major",
  "core",
  "specialization",
  "choice",
  "soft",
  "stem",
  "minor",
  "electives",
  "prerequisites",
  "corequisites",
  "postrequisites",
  "fast-track",
] as const;

export type GlossaryId = (typeof GLOSSARY_IDS)[number];
