export type UUID = string;

export type CourseType = "mandatory" | "elective" | "other";

export const typeSlugToName: Record<CourseType, string> = {
  mandatory: "Обязательный",
  elective: "По выбору",
  other: "Другое",
}

export type CourseCategory =
  | "fundamentals"
  | "ai"
  | "stem"
  | "soft"
  | "business"
  | "tech"
  | "design";

export const categorySlugToName: Record<CourseCategory, string> = {
  fundamentals: "Fundamentals",
  ai: "AI",
  business: "Business",
  tech: "Tech",
  design: "Design",
  stem: "STEM",
  soft: "Soft",
}

export type MajorRequirementType = 
  | "major_core"
  | "major_choice"
  | "flex"
  | "university"
  | "elective"
  | "minor"
  | "soft"
  | "selected_topics"

export const requirementSlugToName: Record<MajorRequirementType, string> = {
  major_core: "Major Core",
  major_choice: "Choice",
  university: "University",
  minor: "Minor",
  soft: "Soft",
  elective: "Elective",
  flex: "Other",
  selected_topics: "Other"
}

export type MajorSchool = 
  | "Tech"
  | "Business"
  | "Common"