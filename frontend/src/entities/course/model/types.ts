import { SemesterNumber } from "@/shared/constants";
import type { UUID, CourseCategory, CourseType, MajorRequirementType } from "@/shared/model";

// Frontend domain model for a course (camelCase, normalized from CourseDto)
export interface Course {
  id: UUID;
  title: string;
  description?: string | null;
  courseType: CourseType;
  category: CourseCategory;
  handbookLink: string,
  availableSemesters: SemesterNumber[];
  allowedCohorts?: number[];
  recommendedSemester?: SemesterNumber | null;
  workload: number;
  prerequisites?: UUID[];
  corequisites?: UUID[];
  toMajor: Record<UUID, MajorRequirementType>
}
