import { useMutation } from "@tanstack/react-query";

import { normalizeRoadmap } from "../lib";

import type { GoalPathRequestDto } from "./dto";
import { generateGoalPath } from "./generateGoalPath";

// Build a goal-path roadmap and return it normalized to the frontend domain
export const useGoalPathMutation = () =>
  useMutation({
    mutationFn: (body: GoalPathRequestDto) =>
      generateGoalPath(body).then(normalizeRoadmap),
  });
