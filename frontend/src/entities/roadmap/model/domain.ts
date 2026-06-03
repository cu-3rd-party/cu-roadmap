import { UUID } from "@/shared/model";

import { MessageLevel } from "../api";

// Frontend domain models for planner results (normalized from the DTOs).
export interface RoadmapSemester {
  semester: number;
  totalLoad: number;
  courses: UUID[];
}

export interface Roadmap {
  error?: string;
  semesters: RoadmapSemester[];
}

export interface ValidationMessage {
  level: MessageLevel;
  message: string;
  courseId?: string | null;
}

export interface SemesterValidation {
  semester: number;
  valid: boolean;
  totalLoad: number;
  messages: ValidationMessage[];
}

export type RoadmapValidation = SemesterValidation[];
