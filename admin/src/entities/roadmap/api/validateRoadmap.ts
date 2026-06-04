import { apiClient } from "@/shared/api";

import type {
  ValidateRoadmapRequestDto,
  ValidateRoadmapResponseDto,
} from "./dto";

export const validateRoadmap = async (
  body: ValidateRoadmapRequestDto,
): Promise<ValidateRoadmapResponseDto> =>
  (
    await apiClient.post<ValidateRoadmapResponseDto>(
      "planner/validate-roadmap/",
      body,
    )
  ).data;
