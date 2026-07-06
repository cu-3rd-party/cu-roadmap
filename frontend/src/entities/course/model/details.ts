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

export interface SpecializationItem {
  title: string;
  mandatory: boolean;
}

export interface SemesterItem {
  label: string;
  recommended: boolean;
}

export interface CourseDetails {
  title: string;
  description?: string | null;
  syllabus: string;
  admissionYears: string;
  category: string;
  isCore: boolean;
  specializations: SpecializationItem[];
  seasons: Season[];
  availableSemesters: SemesterItem[];
  academicLoad: string[]; // pre-formatted lines, e.g. ["2 лекции в неделю", "1 семинар в неделю"]
  prerequisites: PrerequisiteGroupItem[];
  postrequisites: RequisiteItem[];
  corequisites: RequisiteItem[];
}
