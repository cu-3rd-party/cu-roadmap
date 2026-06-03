import { AdmissionYear, SemesterNumber } from "@/shared/constants";
import {
  CourseCategory,
  CourseType,
  MajorRequirementType,
  UUID,
} from "@/shared/model";

// Raw course as returned by GET /api/v1/courses/
export interface CourseDto {
  id: UUID;
  title: string;
  description?: string | null;
  course_type: CourseType;
  category: CourseCategory;
  handbook_link?: string | null;
  available_semesters: SemesterNumber[];
  allowed_cohorts?: AdmissionYear[];
  recommended_semester?: SemesterNumber | null;
  workload: number;
  /** UUIDs of prerequisite courses. */
  prerequisites?: UUID[];
  corequisites?: UUID[];
  postrequisites?: UUID[];
  to_major: Record<UUID, MajorRequirementType>;
}
