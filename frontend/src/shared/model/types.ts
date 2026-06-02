export type UUID = string;

export type CourseType = "mandatory" | "elective" | "other";

export type CourseCategory =
  | "fundamentals"
  | "ai"
  | "stem"
  | "soft"
  | "business"
  | "tech"
  | "design";

export type MajorRequirementType = 
  | "major_core"
  | "major_choice"
  | "flex"
  | "university"
  | "elective"
  | "minor"
  | "soft"
  | "selected_topics"

export type MajorSchool = 
  | "Tech"
  | "Business"
  | "Common"