import { useMutation } from "@tanstack/react-query";

import { normalizeValidationRoadmap } from "../lib";
import { usePlannerStore } from "../model";

import { validateRoadmap } from "./validateRoadmap";

// Fire-and-forget validation of the current plan. onSuccess lives here (not at
// the mutate() call site) so it still runs when the caller unmounts before the request settles
export const useValidateRoadmapMutation = () =>
  useMutation({
    mutationFn: validateRoadmap,
    onSuccess: (data) =>
      usePlannerStore
        .getState()
        .setValidation(normalizeValidationRoadmap(data)),
  });
