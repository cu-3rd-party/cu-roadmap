import { apiClient } from "@/shared/api";
import { AdmissionYear } from "@/shared/constants";

import type { MajorDto } from "./dto";

export const getMajors = async (admissionYear: AdmissionYear): Promise<MajorDto[]> =>
  (await apiClient.get<MajorDto[]>(`majors/${admissionYear}`)).data;
