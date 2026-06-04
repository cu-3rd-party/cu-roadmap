import type { MajorDto, MajorMatchDto, MajorRequirementDto } from "../api";
import type { Major, MajorMatch, MajorRequirement } from "../model";

const normalizeRequirement = (dto: MajorRequirementDto): MajorRequirement => {
  return {
    courseId: dto.course_id,
    requirementType: dto.requirement_type,
  };
};

export const normalizeMajor = (dto: MajorDto): Major => {
  return {
    id: dto.id,
    title: dto.title,
    school: dto.school,
    requirements:
      dto.requirements?.map((req) => normalizeRequirement(req)) ?? [],
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
