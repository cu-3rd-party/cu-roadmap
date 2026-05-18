import { useMutation } from "@tanstack/react-query";

import { api } from "@/shared/config";
import { useRoadmapStore } from "@/shared/store";

export interface GenerateRoadmapParams {
  passed_course_ids: string[];
  major_id: string;
  current_semester: number;
  max_load: number;
}

export function useGenerateRoadmapMutation() {
  return useMutation({
    mutationFn: (params: GenerateRoadmapParams) =>
      api.generateRoadmap(params).then((res) => res.data),
    onSuccess: (data) => useRoadmapStore.getState().setRoadmapData(data),
  });
}
