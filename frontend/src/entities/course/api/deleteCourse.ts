import { apiClient } from "@/shared/api";
import type { UUID } from "@/shared/model";

/* Admin-only (auth-token cookie). The backend deletes the `courses` row and
   nothing else, so a course still referenced by a box or a dependency trips an
   FK constraint and comes back as a 500 — callers must surface the error. */
export const deleteCourse = async (courseId: UUID): Promise<void> => {
  await apiClient.delete(`courses/${courseId}`);
};
