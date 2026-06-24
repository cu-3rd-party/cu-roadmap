import { apiClient } from "@/shared/api";
import { AdmissionYear } from "@/shared/constants";
import type { UUID } from "@/shared/model";

import type { CourseDto } from "./dto";

export const getCourses = async (
  admissionYear: AdmissionYear,
  majorId: UUID,
): Promise<CourseDto[]> =>
  (await apiClient.get<CourseDto[]>(`courses/${admissionYear}/${majorId}`))
    .data;
