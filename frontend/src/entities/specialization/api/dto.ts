import { SemesterNumber } from "@/shared/constants";
import { UUID } from "@/shared/model";

export interface SpecializationDto {
  id: UUID;
  major_id: UUID;
  title: string;
}

// Item of the POST majors/identify-specializations/{year} response
export interface SpecializationMatchDto {
  id: UUID;
  major_id: UUID;
  title: string;
  cohort_year: number;
  score: number;
  covered_count: number;
  can_cover_count: number;
  total_count: number;
}

// Request body for POST majors/identify-specializations/{year}
// (identical to the identify-majors request).
export interface IdentifySpecializationsRequestDto {
  passed_course_ids: UUID[];
  current_semester: SemesterNumber;
}
