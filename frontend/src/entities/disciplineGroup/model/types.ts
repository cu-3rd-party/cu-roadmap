import type { UUID } from "@/shared/model";

export interface DisciplineGroupNode {
  type: "course" | "logical" | "optional" | null;
  logicalOp: "and" | "or" | "xor" | null;
  minCount: number;
  maxCount: number | null;
  courseId: UUID | null;
  title: string;
  children: DisciplineGroupNode[];
}

// Frontend domain model for a discipline group (camelCase, normalized from DTO)
export interface DisciplineGroup {
  id: UUID;
  title: string;
  /* Free-form on the backend (plain varchar, no enum) — values seen so far are
     "prerequisite"/"corequisite". Deliberately not typed as CourseCategory. */
  category: string;
  expression: DisciplineGroupNode;
  rootBoxId: UUID;
}
