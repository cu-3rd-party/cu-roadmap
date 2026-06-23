import type { SpecializationDto } from "../api";
import type { Specialization } from "../model";

export const normalizeSpecialization = (
  dto: SpecializationDto,
): Specialization => {
  return {
    id: dto.id,
    majorId: dto.major_id,
    title: dto.title,
  };
};
