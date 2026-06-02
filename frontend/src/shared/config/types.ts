export interface Course {
  id: string;
  title: string;
  category?: string;
  type?: string;
  course_type?: string;
  workload: number;
  description?: string;
  available_semesters?: number[];
  allowed_cohorts?: number[];
  recommended_semester?: number | null;
  prerequisites?: string[];
  corequisites?: string[];
  postrequisites?: string[];
  handbook_link?: string;
  to_major?: Record<string, string>;
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
