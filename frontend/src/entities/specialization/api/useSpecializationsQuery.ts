import { useQuery } from "@tanstack/react-query";

import type { UUID } from "@/shared/model";

import { normalizeSpecialization } from "../lib";

import { getSpecializations } from "./getSpecializations";

export const specializationsQueryKey = (majorId: UUID) =>
  ["specializations", majorId] as const;

export const useSpecializationsQuery = (majorId: UUID | null) =>
  useQuery({
    queryKey: ["specializations", majorId],
    queryFn: () =>
      getSpecializations(majorId!).then((dtos) =>
        dtos
          .map(normalizeSpecialization)
          .sort((a, b) => a.title.localeCompare(b.title)),
      ),
    enabled: majorId != null,
  });
