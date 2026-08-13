import { useCallback } from "react";

import type { AdmissionYear } from "@/shared/constants";

import { buildValidateRoadmapRequest } from "../lib";
import { usePlannerStore } from "../model";

import { useValidateRoadmapMutation } from "./useValidateRoadmapMutation";

// Validates the whole current plan and stores the result (fire-and-forget).
// The result is stored in onSuccess on the mutation hook itself.
export const useValidatePlan = () => {
  const { mutate } = useValidateRoadmapMutation();
  return useCallback(
    (
      admissionYear: AdmissionYear | null,
      majorId?: string | null,
      specializationId?: string | null,
    ) => {
      if (admissionYear == null) return;
      const { selections } = usePlannerStore.getState();
      mutate(
        buildValidateRoadmapRequest(
          selections,
          admissionYear,
          majorId,
          specializationId,
        ),
      );
    },
    [mutate],
  );
};
