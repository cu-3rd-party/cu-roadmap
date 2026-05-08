export interface Course {
  id: string;
  title: string;
  category: string;
  type?: string;
  workload: number;
}

export interface Major {
  id: string;
  title: string;
  name?: string;
  school?: string;
}

export interface CourseBasic {
  id: string;
  title: string;
}

export interface SemesterData {
  semester: number;
  total_load?: number;
  error?: string;
  status?: string;
  courses: Course[];
}

export interface RoadmapResponse {
  roadmap: SemesterData[];
}

export interface MajorResult {
  id: string;
  title: string;
  score: number;
}

export interface RoadmapSemester {
  semester: number;
  course_ids: string[];
}

export interface ValidationMessage {
  level: string;
  message: string;
}

export interface ValidationResult {
  semester: number;
  valid: boolean;
  total_load: number;
  messages: ValidationMessage[];
}

export interface GraphNode {
  id: string;
  label: string;
  group: string;
  title: string;
  recommended_semester: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
