import { useMutation } from "@tanstack/react-query";

import { api, type ValidationResult } from "@/shared/config";

export interface ValidateRoadmapParams {
  passed_course_ids: string[];
  roadmap: { semester: number; course_ids: string[] }[];
  max_load: number;
}

export function useValidateRoadmapMutation() {
  return useMutation<ValidationResult[], Error, ValidateRoadmapParams>({
    mutationFn: (params) =>
      api.validateRoadmap(params).then((res) => res.data.validation_results),
  });
}
