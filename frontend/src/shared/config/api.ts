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
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1",
});

function adminHeaders(token: string) {
  return { headers: { "X-Admin-Token": token } };
}

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

  getGraphData: () => client.get<GraphData>("/graph/data"),

  admin: {
    getCourses: (token: string) =>
      client.get<Course[]>("/courses/", adminHeaders(token)),
    getMajors: (token: string) =>
      client.get<Major[]>("/majors/", adminHeaders(token)),
    createCourse: (course: Partial<Course>, token: string) =>
      client.post<Course>("/courses/", course, adminHeaders(token)),
    updateCourse: (id: string, course: Partial<Course>, token: string) =>
      client.put<Course>(`/courses/${id}`, course, adminHeaders(token)),
    deleteCourse: (id: string, token: string) =>
      client.delete(`/courses/${id}`, adminHeaders(token)),
    updateMajor: (
      id: string,
      major: Record<string, unknown>,
      token: string,
    ) => client.put(`/majors/${id}`, major, adminHeaders(token)),
  },
};
