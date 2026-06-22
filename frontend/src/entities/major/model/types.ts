import { MajorRequirementType, UUID } from "@/shared/model";

export interface MajorRequirement {
  courseId: UUID;
  requirementType: MajorRequirementType;
}

/** Frontend domain model for a major (normalized from MajorDto). */
export interface Major {
  id: UUID;
  title: string;
  school: string;
  cohortYear: number;
  requirements: MajorRequirement[];
}

/** Frontend domain model for a major match (normalized from MajorMatchDto). */
export interface MajorMatch {
  id: UUID;
  title: string;
  score: number;
  coveredCount: number;
  canCoverCount: number;
  totalCount: number;
}
