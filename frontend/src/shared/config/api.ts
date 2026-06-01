import axios from "axios";
import type {
  Course,
  Major,
  RoadmapResponse,
  MajorResult,
  ValidationResult,
  SemesterData,
  GraphData,
} from "./types";

const client = axios.create({
  baseURL: `${window.location.origin}/api/v1`,
});

export const api = {
  getCourses: () => client.get<Course[]>("/courses/"),

  getMajors: () => client.get<Major[]>("/majors/"),

  generateRoadmap: (params: {
    passed_course_ids: string[];
    major_id: string;
    current_semester: number;
    max_load: number;
  }) => client.post<RoadmapResponse>("/planner/generate", params),

  identifyMajors: (passedIds: string[]) =>
    client.post<MajorResult[]>("/majors/identify", passedIds),

  generateGoalPath: (params: {
    target_course_id: string;
    passed_course_ids: string[];
    current_semester: number;
    max_load: number;
  }) => client.post<{ roadmap: SemesterData[] }>("/planner/goal-path/", params),

  validateRoadmap: (params: {
    passed_course_ids: string[];
    roadmap: { semester: number; course_ids: string[] }[];
    max_load: number;
  }) =>
    client.post<{ validation_results: ValidationResult[] }>(
      "/planner/validate-roadmap/",
      params,
    ),

  getGraphData: () => client.get<GraphData>("/graph/data/"),
};
