import { apiClient } from "@/shared/api";
import { AdmissionYear } from "@/shared/constants";

import type {
  IdentifySpecializationsRequestDto,
  SpecializationMatchDto,
} from "./dto";

export const identifySpecializations = async (
  body: IdentifySpecializationsRequestDto,
  year: AdmissionYear,
): Promise<SpecializationMatchDto[]> =>
  (
    await apiClient.post<SpecializationMatchDto[]>(
      `majors/identify-specializations/${year}`,
      body,
    )
  ).data;
