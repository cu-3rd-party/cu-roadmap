import { apiClient } from "@/shared/api";
import type { AdmissionYear } from "@/shared/constants";
import type { CourseCategory } from "@/shared/model";

import type { CourseDto } from "./dto";

// Filters accepted by GET /api/v1/courses/. The backend takes them as CSV
// query params and applies them in SQL, so an empty array must be omitted
// rather than sent as an empty string.
export interface CourseListFilters {
  cohortYears?: readonly AdmissionYear[];
  categories?: readonly CourseCategory[];
  title?: string;
}

/* Unscoped course list — every course, no major/cohort in the path. The
   trailing slash matters: the Gin route is registered as `/api/v1/courses/`,
   and `courses` without it resolves to `GET /courses/:id`, where `:id` is
   parsed as a cohort year or major UUID. */
export const getAllCourses = async (
  filters: CourseListFilters = {},
): Promise<CourseDto[]> => {
  const params: Record<string, string> = {};

  if (filters.cohortYears?.length)
    params.cohort_year = filters.cohortYears.join(",");
  if (filters.categories?.length)
    params.category = filters.categories.join(",");

  const title = filters.title?.trim();
  if (title) params.title = title;

  return (await apiClient.get<CourseDto[]>("courses/", { params })).data;
};
