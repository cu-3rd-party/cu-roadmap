import type { MajorDto, MajorMatchDto } from "../api";
import type { Major, MajorMatch } from "../model";

export const normalizeMajor = (dto: MajorDto): Major => {
  return {
    id: dto.id,
    title: dto.title,
    type: dto.internal_name,
    cohortYear: dto.cohort_year,
  };
};

export const normalizeMajorMatch = (dto: MajorMatchDto): MajorMatch => {
  return {
    id: dto.id,
    title: dto.title,
    score: dto.score,
    coveredCount: dto.covered_count,
    canCoverCount: dto.can_cover_count,
    totalCount: dto.total_count,
  };
};
