import { apiClient } from "@/shared/api";

import type { DisciplineGroupDto, DisciplineGroupRequestDto } from "./dto";

/* Same missing trailing slash as getDisciplineGroups — the Gin route is
   `rg.POST("")` on the `/discipline-groups` group.

   Unlike createCourse, which answers `{"id": "<uuid>"}` and nothing else, this
   responds 201 with the whole group, so the caller never has to refetch to learn
   what it just made. */
export const createDisciplineGroup = async (
  body: DisciplineGroupRequestDto,
): Promise<DisciplineGroupDto> =>
  (await apiClient.post<DisciplineGroupDto>("discipline-groups", body)).data;
