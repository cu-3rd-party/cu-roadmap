import { apiClient } from "@/shared/api";
import { AdmissionYear } from "@/shared/constants";

import type { IdentifyMajorsRequestDto, MajorMatchDto } from "./dto";

export const identifyMajors = async (
  body: IdentifyMajorsRequestDto,
  year: AdmissionYear,
): Promise<MajorMatchDto[]> =>
  (await apiClient.post<MajorMatchDto[]>(`majors/identify/${year}`, body))
    .data;
