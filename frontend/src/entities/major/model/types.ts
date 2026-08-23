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

/** One specialization inside the structure tree. */
export interface StructureSpecialization {
  id: UUID;
  title: string;
}

/** One major inside the structure tree, with its specializations inlined. */
export interface StructureMajor {
  id: UUID;
  title: string;
  // "" for majors the backend has no slug for — do not treat as MajorType.
  type: string;
  specializations: StructureSpecialization[];
}

/** One cohort year, with every school's majors merged into it. */
export interface StructureYear {
  year: number;
  majors: StructureMajor[];
}
