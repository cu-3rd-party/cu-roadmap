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
  is_core: boolean;
  cohort_year: number;
  score: number;
  covered_count: number;
  can_cover_count: number;
  total_count: number;
  completed_ids: UUID[];
  can_cover_ids: UUID[];
  cannot_cover_ids: UUID[];
  mandatory_ids: UUID[];
}

// Request body for POST majors/identify-specializations/{year}.
// major_id scopes the matches to a single major server-side.
export interface IdentifySpecializationsRequestDto {
  passed_course_ids: UUID[];
  current_semester: SemesterNumber;
  major_id: UUID;
}

// Request body for POST /api/v1/majors/specializations. Both fields are
// required by the backend binding; there is no description field on the model.
export interface CreateSpecializationRequestDto {
  major_id: UUID;
  title: string;
}
