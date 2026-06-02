import { AdmissionYear, SemesterNumber } from "@/shared/constants";
import { UUID } from "@/shared/model";

type MessageLevel = "warning" | "error"

// Roadmap
export interface RoadmapSemesterDto {
  semester: number;
  total_load: number;
  courses: UUID[];
}

export type RoadmapDto = RoadmapSemesterDto[];
// POST /api/v1/planner/generate/

export interface GenerateRoadmapRequestDto {
  passed_course_ids: UUID[];
  major_id: UUID;
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
  passed_course_ids: UUID[];
  max_load?: number;
  roadmap: {
    semester: number;
    course_ids: UUID[];
  }[];
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
  max_load?: number;
}

export interface GoalPathResponseDto {
  error?: string;
  roadmap: RoadmapDto;
}
