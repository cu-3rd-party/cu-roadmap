import { useMutation } from "@tanstack/react-query";

import { normalizeRoadmap } from "../lib";

import type { GenerateRoadmapRequestDto } from "./dto";
import { generateRoadmap } from "./generateRoadmap";

// Generate a roadmap and return it normalized to the frontend domain model.
export const useGenerateRoadmapMutation = () =>
  useMutation({
    mutationFn: (body: GenerateRoadmapRequestDto) =>
      generateRoadmap(body).then(normalizeRoadmap),
  });
