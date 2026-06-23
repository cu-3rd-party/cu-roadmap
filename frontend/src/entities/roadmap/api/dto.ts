import { AdmissionYear, SemesterNumber } from "@/shared/constants";
import { UUID } from "@/shared/model";

export type MessageLevel = "warning" | "error";

// Roadmap
export interface RoadmapSemesterDto {
  semester: number;
  total_load: number;
  course_ids: UUID[];
}

export type RoadmapDto = RoadmapSemesterDto[];
// POST /api/v1/planner/generate/

// A semester's worth of placed courses, segmented for the generate payload.
export interface PlannedSemesterDto {
  semester: number;
  course_ids: UUID[];
}

// Whether the backend should generate from already-passed courses only, or also
// treat the planned (selected) courses as a basis.
export type CourseSource = "passed" | "selected";

export interface GenerateRoadmapRequestDto {
  // courses in completed semesters
  passed_course_ids: UUID[];
  // remaining placed courses, segmented by semester
  selected_course_ids: PlannedSemesterDto[];
  course_source: CourseSource;
  major_id: UUID;
  // selected specialization of the major; omitted when none is chosen
  specialization_id?: UUID;
  // semester to start counter from
  current_semester?: SemesterNumber;
  // measured in credits, default 12.0
  max_load?: number;
  cohort: AdmissionYear;
}

export interface GenerateRoadmapResponseDto {
  error?: string;
  major_id: UUID;
  roadmap: RoadmapDto;
}

// Validation messages (shared by validate-semester / validate-roadmap)

export interface ValidationMessageDto {
  level: MessageLevel;
  message: string;
  course_id?: UUID | null;
}

// POST /api/v1/planner/validate-semester/

export interface ValidateSemesterRequestDto {
  current_semester: SemesterNumber;
  // courses which user wants to take
  course_ids: UUID[];
  // already passed
  passed_course_ids: UUID[];
  max_load?: number;
}

export interface ValidateSemesterResponseDto {
  is_valid: boolean;
  messages: ValidationMessageDto[];
  total_load: number;
}

// POST /api/v1/planner/validate-roadmap/

export interface ValidateRoadmapRequestDto {
  max_load?: number;
  roadmap: {
    semester: number;
    course_ids: UUID[];
  }[];
  current_semester: SemesterNumber;
}

export interface ValidationResultDto {
  semester: SemesterNumber;
  valid: boolean;
  total_load: number;
  messages: ValidationMessageDto[];
}

export interface ValidateRoadmapResponseDto {
  validation_results: ValidationResultDto[];
}

// POST /api/v1/planner/goal-path/

export interface GoalPathRequestDto {
  target_course_id: UUID;
  passed_course_ids: UUID[];
  current_semester?: SemesterNumber;
  // target semester to take the course in; omitted means "any"
  goal_semester?: SemesterNumber;
  max_load?: number;
}

export interface GoalPathResponseDto {
  error?: string;
  roadmap: RoadmapDto;
}
