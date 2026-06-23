import { apiClient } from "@/shared/api";
import { UUID } from "@/shared/model";

import type { SpecializationDto } from "./dto";

export const getSpecializations = async (
  majorId: UUID,
): Promise<SpecializationDto[]> =>
  (
    await apiClient.get<SpecializationDto[]>(
      `majors/specializations/${majorId}`,
    )
  ).data;
