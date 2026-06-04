import { UUID } from "@/shared/model";

export type Season = "autumn" | "spring";

export interface RequisiteItem {
  id: UUID;
  title: string;
}

export interface CourseDetails {
  title: string;
  description?: string | null;
  syllabus: string;
  admissionYears: string;
  category: string;
  specialisations: string[];
  seasons: Season[];
  recommendedSemester: string;
  prerequisites: RequisiteItem[];
  postrequisites: RequisiteItem[];
  corequisites: RequisiteItem[];
}
