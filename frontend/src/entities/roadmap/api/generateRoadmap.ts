import { apiClient } from "@/shared/api";

import type {
  GenerateRoadmapRequestDto,
  GenerateRoadmapResponseDto,
} from "./dto";

export const generateRoadmap = async (
  body: GenerateRoadmapRequestDto,
): Promise<GenerateRoadmapResponseDto> =>
  (await apiClient.post<GenerateRoadmapResponseDto>("planner/generate/", body))
    .data;
