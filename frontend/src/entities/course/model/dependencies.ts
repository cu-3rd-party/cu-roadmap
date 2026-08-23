import type { UUID } from "@/shared/model";

import type { DependencyType } from "../api/dto";

/* Frontend domain model for one course dependency row. */
export interface CourseDependency {
  id: UUID;
  courseId: UUID;
  requiredCourseId: UUID | null;
  requiredGroupId: UUID | null;
  type: DependencyType;
  /* 0 = required. Rows sharing a positive number are alternatives — take one. */
  alternativeGroup: number;
}
