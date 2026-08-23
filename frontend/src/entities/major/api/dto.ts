import { SemesterNumber } from "@/shared/constants";
import { MajorRequirementType, MajorType, UUID } from "@/shared/model";

export interface MajorRequirementDto {
  course_id: UUID;
  requirement_type: MajorRequirementType;
}

// Raw major as returned by GET /api/v1/majors/
export interface MajorDto {
  id: UUID;
  title: string;
  internal_name: MajorType;
  cohort_year: number;
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
  passed_course_ids: UUID[];
  current_semester: SemesterNumber;
};

/* GET /api/v1/majors/structure — the school -> cohort year -> majors ->
   specializations tree. Shapes are declared inline in the Go handler, so they
   are separate from MajorDto rather than an extension of it. */

export interface StructureSpecializationDto {
  id: UUID;
  title: string;
}

export interface StructureMajorDto {
  id: UUID;
  title: string;
  // Derived server-side from a hardcoded switch on the Russian title, so it is
  // "" for every major outside the three known ones — not a MajorType.
  internal_name: string;
  specializations: StructureSpecializationDto[];
}

export interface StructureYearDto {
  year: number;
  majors: StructureMajorDto[];
}

export interface StructureSchoolDto {
  school: string;
  cohort_years: StructureYearDto[];
}
