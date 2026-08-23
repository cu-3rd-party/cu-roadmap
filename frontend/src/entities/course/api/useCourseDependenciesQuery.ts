import { useQuery } from "@tanstack/react-query";

import type { UUID } from "@/shared/model";

import { normalizeCourseDependency } from "../lib/normalizeCourseDependency";

import { getCourseDependencies } from "./getCourseDependencies";

export const courseDependenciesQueryKey = (id: UUID | undefined) =>
  ["course-dependencies", id] as const;

export const useCourseDependenciesQuery = (id: UUID | undefined) =>
  useQuery({
    queryKey: courseDependenciesQueryKey(id),
    queryFn: () =>
      getCourseDependencies(id!).then((dtos) =>
        dtos.map(normalizeCourseDependency),
      ),
    enabled: id != null,
  });
