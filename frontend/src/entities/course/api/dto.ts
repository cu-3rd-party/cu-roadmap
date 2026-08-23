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

/* Body of POST /api/v1/courses/. Only `title` is enforced by the backend binding
   — it fills seminars_week/workload itself and leaves the rest at its zero value
   — so everything else is optional and a stub course is legal. */
export interface CreateCourseRequestDto {
  title: string;
  category?: CourseCategory;
  allowed_cohorts?: number[];
  available_semesters?: number[];
}

export type DependencyType = "prerequisite" | "corequisite";

/* Raw row from GET /api/v1/courses/{id}/dependencies. Exactly one of
   required_course_id / required_group_id identifies the requisite, except for
   rows written by the sheet sync, which set both. */
export interface CourseDependencyDto {
  id: UUID;
  course_id: UUID;
  required_course_id?: UUID | null;
  required_group_id?: UUID | null;
  dependency_type: DependencyType;
  alternative_group: number;
}
