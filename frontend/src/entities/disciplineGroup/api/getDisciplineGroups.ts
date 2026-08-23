import { apiClient } from "@/shared/api";

import type { DisciplineGroupDto } from "./dto";

/* NOTE the missing trailing slash — the opposite of getAllCourses. The Gin route
   is registered as `rg.GET("")` on the `/discipline-groups` group, so the path is
   exactly `/api/v1/discipline-groups`; adding a slash would redirect. */
export const getDisciplineGroups = async (): Promise<DisciplineGroupDto[]> =>
  (await apiClient.get<DisciplineGroupDto[]>("discipline-groups")).data;
