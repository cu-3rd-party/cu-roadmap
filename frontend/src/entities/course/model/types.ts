import { SemesterNumber } from "@/shared/constants";
import type {
  UUID,
  CourseCategory,
  CourseType,
  MajorRequirementType,
} from "@/shared/model";

export interface CoursePrerequisite {
  courses: UUID[];
  groupId: UUID;
}

// Frontend domain model for a course (camelCase, normalized from CourseDto)
export interface Course {
  id: UUID;
  title: string;
  description?: string | null;
  type: CourseType;
  category: CourseCategory;
  handbookLink: string;
  availableSemesters: SemesterNumber[];
  allowedCohorts?: number[];
  recommendedSemester?: SemesterNumber | null;
  workload: number;
  prerequisites?: CoursePrerequisite[];
  corequisites?: UUID[];
  postrequisites?: UUID[];
  specializations?: UUID[];
}
