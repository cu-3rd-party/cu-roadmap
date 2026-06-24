import { UUID } from "@/shared/model";

export type Season = "autumn" | "spring";

export interface PrerequisiteGroupItem {
  groupId: UUID;
  prerequisites: RequisiteItem[];
}

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
  specializations: string[];
  seasons: Season[];
  recommendedSemester: string;
  prerequisites: PrerequisiteGroupItem[];
  postrequisites: RequisiteItem[];
  corequisites: RequisiteItem[];
}
