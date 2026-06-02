import { apiClient } from "@/shared/api";

import type {
  ValidateSemesterRequestDto,
  ValidateSemesterResponseDto,
} from "./dto";

export const validateSemester = async (
  body: ValidateSemesterRequestDto,
): Promise<ValidateSemesterResponseDto> =>
  (
    await apiClient.post<ValidateSemesterResponseDto>(
      "planner/validate-semester/",
      body,
    )
  ).data;
