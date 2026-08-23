import { useQuery } from "@tanstack/react-query";

import type { UUID } from "@/shared/model";

import { normalizeCourse } from "../lib";

import { getCourseById } from "./getCourseById";

export const courseByIdQueryKey = (id: UUID | undefined) =>
  ["course", id] as const;

export const useCourseByIdQuery = (id: UUID | undefined) =>
  useQuery({
    queryKey: courseByIdQueryKey(id),
    queryFn: () => getCourseById(id!).then(normalizeCourse),
    enabled: id != null,
  });
