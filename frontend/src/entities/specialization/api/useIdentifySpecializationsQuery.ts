import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { AdmissionYear } from "@/shared/constants";

import { normalizeSpecializationMatch } from "../lib";

import { buildIdentifySpecializationsRequest } from "./buildIdentifySpecializationsRequest";
import { identifySpecializations } from "./identifySpecializations";

// Order-independent key so reordering selections doesn't refetch.
export const identifySpecializationsQueryKey = (
  courseIds: string[],
  year: AdmissionYear | null,
) => ["specializations", "identify", [...courseIds].sort(), year] as const;

export const useIdentifySpecializationsQuery = (
  courseIds: string[],
  year: AdmissionYear | null,
) =>
  useQuery({
    queryKey: identifySpecializationsQueryKey(courseIds, year),
    queryFn: () =>
      identifySpecializations(
        buildIdentifySpecializationsRequest(courseIds, year!),
        year!,
      ).then((dtos) =>
        (dtos ?? [])
          .map(normalizeSpecializationMatch)
          .sort((a, b) => a.title.localeCompare(b.title)),
      ),
    // Run even with no courses so the planner has initial data on mount.
    enabled: year != null,
    // Keep the previous matches on screen while a changed-key request is in
    // flight, so the cards animate old -> new instead of unmounting.
    placeholderData: keepPreviousData,
  });
