import { AdmissionYear, SemesterNumber } from "@/shared/constants";
import { CourseCategory, CourseType, UUID } from "@/shared/model";

export interface CoursePrerequisiteDto {
  course_ids: UUID[];
  group_id: UUID;
}

// Raw course as returned by GET /api/v1/courses/
export interface CourseDto {
  id: UUID;
  title: string;
  description?: string | null;
  by_major_type: CourseType;
  category: CourseCategory;
  handbook_link?: string | null;
  available_semesters: SemesterNumber[];
  allowed_cohorts?: AdmissionYear[];
  recommended_semester?: SemesterNumber | null;
  // 0 = not fixed (normal flow); 1-8 = course is pinned to that semester
  fixed_semester?: SemesterNumber | 0;
  workload: number;
  lectures_week?: number;
  seminars_week?: number;
  /** UUIDs of prerequisite courses. */
  prerequisites?: CoursePrerequisiteDto[];
  corequisites?: UUID[];
  postrequisites?: UUID[];
  specializations?: UUID[];
  mandatory_specializations?: UUID[];
}
