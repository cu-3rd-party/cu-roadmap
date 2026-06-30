import { SemesterNumber } from "@/shared/constants";
import { UUID } from "@/shared/model";

export interface SpecializationDto {
  id: UUID;
  major_id: UUID;
  title: string;
}

export interface SpecializationMatchCourseDto {
  course_id: UUID;
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
  covered_courses: SpecializationMatchCourseDto[];
  can_cover_courses: SpecializationMatchCourseDto[];
  cannot_cover_courses: SpecializationMatchCourseDto[];
}

// Request body for POST majors/identify-specializations/{year}.
// major_id scopes the matches to a single major server-side.
export interface IdentifySpecializationsRequestDto {
  passed_course_ids: UUID[];
  current_semester: SemesterNumber;
  major_id: UUID;
}
