import { apiClient } from "@/shared/api";
import type { UUID } from "@/shared/model";

import type { CreateSpecializationRequestDto, SpecializationDto } from "./dto";

/* Unlike POST courses/, this responds 201 with the whole created object rather
   than { id }, so the id is read off a SpecializationDto. */
export const createSpecialization = async (
  body: CreateSpecializationRequestDto,
): Promise<UUID> =>
  (await apiClient.post<SpecializationDto>("majors/specializations", body)).data
    .id;
