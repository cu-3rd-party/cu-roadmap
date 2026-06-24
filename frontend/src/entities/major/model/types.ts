import { MajorType, UUID } from "@/shared/model";

/** Frontend domain model for a major (normalized from MajorDto). */
export interface Major {
  id: UUID;
  title: string;
  type: MajorType;
  cohortYear: number;
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
