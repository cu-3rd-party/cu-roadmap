import type { SemesterData } from "./types";

export type {
  Course,
  Major,
  Specialization,
  CourseRestriction,
  CourseRestrictionInput,
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

export interface RoadmapData {
  roadmap: SemesterData[];
}
