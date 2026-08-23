import { apiClient } from "@/shared/api";
import type { UUID } from "@/shared/model";

import type { CreateCourseRequestDto } from "./dto";

/* Admin-only (auth-token cookie). Responds 201 {"id": "<uuid>"} and nothing
   else, so the new course has to be refetched — the id is all we get back. */
export const createCourse = async (
  body: CreateCourseRequestDto,
): Promise<UUID> =>
  (await apiClient.post<{ id: UUID }>("courses/", body)).data.id;
