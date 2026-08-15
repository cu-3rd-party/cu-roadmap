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
  cohort_year?: number;
}

export interface Specialization {
  id: string;
  major_id: string;
  title: string;
  course_restrictions?: CourseRestriction[];
}

export interface CourseBasic {
  id: string;
  title: string;
}

export interface SemesterData {
  semester: number;
  course_ids?: string[];
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
  cohort_year?: number;
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

export interface CourseRestriction {
  id: string;
  specialization_id: string;
  semester: number;
  category: string;
  min_courses: number;
  max_courses: number;
  internal_description?: string;
}

export interface CourseRestrictionInput {
  semester: number;
  category: string;
  min_courses: number;
  max_courses: number;
  internal_description?: string;
}

export interface DisciplineGroup {
  id: string;
  title: string;
  category: string;
  math_expression: Record<string, any>;
  root_box_id: string;
}

export interface DisciplineGroupInput {
  title: string;
  category: string;
  math_expression: Record<string, any>;
}
