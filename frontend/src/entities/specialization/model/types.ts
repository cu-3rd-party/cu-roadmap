import { UUID } from "@/shared/model";

export interface Specialization {
  id: UUID;
  majorId: UUID;
  title: string;
}

// Frontend domain model for a specialization match (normalized from SpecializationMatchDto).
export interface SpecializationMatch {
  id: UUID;
  majorId: UUID;
  title: string;
  cohortYear: number;
  score: number;
  coveredCount: number;
  canCoverCount: number;
  totalCount: number;
}
