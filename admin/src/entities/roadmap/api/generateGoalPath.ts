import { apiClient } from "@/shared/api";

import type { GoalPathRequestDto, GoalPathResponseDto } from "./dto";

export const generateGoalPath = async (
  body: GoalPathRequestDto,
): Promise<GoalPathResponseDto> =>
  (await apiClient.post<GoalPathResponseDto>("planner/goal-path/", body)).data;
