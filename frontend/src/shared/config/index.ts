import { getCategoryColor } from "@/shared/lib";

import type { SemesterData } from "./types";

export type {
  Course,
  Major,
  CourseBasic,
  SemesterData,
  RoadmapResponse,
  MajorResult,
  RoadmapSemester,
  ValidationMessage,
  ValidationResult,
  GraphNode,
  GraphEdge,
  GraphData,
} from "./types";
export { api } from "./api";
export { getCategoryColor };

export interface RoadmapData {
  roadmap: SemesterData[];
}
