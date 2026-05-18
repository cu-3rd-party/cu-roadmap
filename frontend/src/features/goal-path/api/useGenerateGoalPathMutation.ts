import { useMutation } from "@tanstack/react-query";

import { api, type SemesterData } from "@/shared/config";

export interface GenerateGoalPathParams {
  target_course_id: string;
  passed_course_ids: string[];
  current_semester: number;
  max_load: number;
}

export function useGenerateGoalPathMutation() {
  return useMutation<SemesterData[], Error, GenerateGoalPathParams>({
    mutationFn: (params) =>
      api.generateGoalPath(params).then((res) => res.data.roadmap),
  });
}
