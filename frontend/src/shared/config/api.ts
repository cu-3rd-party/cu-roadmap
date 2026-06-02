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
  withCredentials: true,
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

  getGraphData: () => client.get<GraphData>("/graph/data"),

  login: (password: string) =>
    client.post("/auth/login", { password }),

  admin: {
    getCourses: () => client.get<Course[]>("/courses/"),
    getMajors: () => client.get<Major[]>("/majors/"),
    createCourse: (course: Partial<Course>) =>
      client.post<Course>("/courses/", course),
    updateCourse: (id: string, course: Partial<Course>) =>
      client.put<Course>(`/courses/${id}`, course),
    deleteCourse: (id: string) =>
      client.delete(`/courses/${id}`),
    updateMajor: (id: string, major: Record<string, unknown>) =>
      client.put(`/majors/${id}`, major),
  },
};
