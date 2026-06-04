import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { AdmissionYear } from "@/shared/constants";

import { normalizeMajorMatch } from "../lib";

import { buildIdentifyMajorsRequest } from "./buildIdentifyMajorsRequest";
import { identifyMajors } from "./identifyMajors";

// Order-independent key so reordering selections doesn't refetch.
export const identifyMajorsQueryKey = (courseIds: string[]) =>
  ["majors", "identify", [...courseIds].sort()] as const;

export const useIdentifyMajorsQuery = (
  courseIds: string[],
  year: AdmissionYear | null,
) =>
  useQuery({
    queryKey: identifyMajorsQueryKey(courseIds),
    queryFn: () =>
      identifyMajors(buildIdentifyMajorsRequest(courseIds, year!), year!).then((dtos) =>
        dtos.map(normalizeMajorMatch).sort((dto1, dto2) => dto1.title.localeCompare(dto2.title)),
      ),
    // Run even with no courses so the planner has initial major data on mount.
    enabled: year != null,
    // Keep the previous matches on screen while a changed-key request is in
    // flight, so the major cards animate old -> new instead of unmounting.
    placeholderData: keepPreviousData,
  });
