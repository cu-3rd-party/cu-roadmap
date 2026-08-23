import { apiClient } from "@/shared/api";
import type { UUID } from "@/shared/model";

import type { CourseDependencyDto } from "./dto";

/* Full dependency rows for one course. Unlike the `prerequisites` field on the
   course itself, this exposes `required_group_id` and `alternative_group`, so a
   box requisite and a "выбор 1 из N" alternative are both visible here. */
export const getCourseDependencies = async (
  courseId: UUID,
): Promise<CourseDependencyDto[]> =>
  (
    await apiClient.get<CourseDependencyDto[]>(
      `courses/${courseId}/dependencies`,
    )
  ).data;
