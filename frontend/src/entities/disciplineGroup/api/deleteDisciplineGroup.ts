import { apiClient } from "@/shared/api";
import type { UUID } from "@/shared/model";

/* Answers 204 — including for an id that never existed, so a missing group is
   not distinguishable from a deleted one. The backend wipes the group's box tree
   and root box first; a group still referenced by a course dependency trips an
   FK constraint and comes back as a 500, so callers must surface the error. */
export const deleteDisciplineGroup = async (groupId: UUID): Promise<void> => {
  await apiClient.delete(`discipline-groups/${groupId}`);
};
