import type { SpecializationDto, SpecializationMatchDto } from "../api";
import type { Specialization, SpecializationMatch } from "../model";

export const normalizeSpecialization = (
  dto: SpecializationDto,
): Specialization => {
  return {
    id: dto.id,
    majorId: dto.major_id,
    title: dto.title,
  };
};

export const normalizeSpecializationMatch = (
  dto: SpecializationMatchDto,
): SpecializationMatch => {
  return {
    id: dto.id,
    majorId: dto.major_id,
    title: dto.title,
    isCore: dto.is_core,
    cohortYear: dto.cohort_year,
    score: dto.score,
    coveredCount: dto.covered_count,
    canCoverCount: dto.can_cover_count,
    totalCount: dto.total_count,
    completedIds: dto.completed_ids,
    canCoverIds: dto.can_cover_ids,
    cannotCoverIds: dto.cannot_cover_ids,
  };
};
