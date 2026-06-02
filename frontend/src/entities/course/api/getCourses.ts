import { apiClient } from "@/shared/api";
import { AdmissionYear } from "@/shared/constants";

import type { CourseDto } from "./dto";


export const getCourses = async (admissionYear: AdmissionYear): Promise<CourseDto[]> =>
  (await apiClient.get<CourseDto[]>(`courses/${admissionYear}`)).data;
