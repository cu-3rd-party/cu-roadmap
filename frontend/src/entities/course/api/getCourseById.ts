import { apiClient } from "@/shared/api";
import type { UUID } from "@/shared/model";

import type { CourseDto } from "./dto";

/* Single course lookup. The path is `courses/byId/{id}` rather than the obvious
   `courses/{id}`: that route is already taken on the backend, where `:id` is parsed as
   a cohort year or a major UUID and a course id there answers 404 "major not found". */
export const getCourseById = async (id: UUID): Promise<CourseDto> =>
  (await apiClient.get<CourseDto>(`courses/byId/${id}`)).data;
