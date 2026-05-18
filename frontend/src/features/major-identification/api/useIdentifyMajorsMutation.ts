import { useMutation } from "@tanstack/react-query";

import { api, type MajorResult } from "@/shared/config";

export function useIdentifyMajorsMutation() {
  return useMutation<MajorResult[], Error, string[]>({
    mutationFn: (passedIds) =>
      api.identifyMajors(passedIds).then((res) => res.data),
  });
}
