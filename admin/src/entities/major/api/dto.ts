import { SemesterNumber } from "@/shared/constants";
import { MajorRequirementType, MajorSchool, UUID } from "@/shared/model";

export interface MajorRequirementDto {
  course_id: UUID;
  requirement_type: MajorRequirementType;
}

// Raw major as returned by GET /api/v1/majors/
export interface MajorDto {
  id: UUID;
  title: string;
  school: MajorSchool;
  requirements: MajorRequirementDto[];
}

// Item of the POST /api/v1/majors/identify/ response
export interface MajorMatchDto {
  id: UUID;
  title: string;
  score: number;
  covered_count: number;
  can_cover_count: number;
  total_count: number;
}

// Request body for POST /api/v1/majors/identify/ - UUIDs of passed courses
export type IdentifyMajorsRequestDto = {
  passed_courses_ids: UUID[];
  current_semester: SemesterNumber;
};
