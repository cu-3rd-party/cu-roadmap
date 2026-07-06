import { describe, expect, it } from "vitest";

import type { SpecializationDto, SpecializationMatchDto } from "../../api";
import {
  normalizeSpecialization,
  normalizeSpecializationMatch,
} from "../normalizeSpecialization";

describe("normalizeSpecialization", () => {
  it("converts snake_case dto to camelCase domain model", () => {
    const dto: SpecializationDto = {
      id: "s1",
      major_id: "m1",
      title: "Backend",
    };

    expect(normalizeSpecialization(dto)).toEqual({
      id: "s1",
      majorId: "m1",
      title: "Backend",
    });
  });
});

describe("normalizeSpecializationMatch", () => {
  it("converts snake_case dto to camelCase", () => {
    const dto: SpecializationMatchDto = {
      id: "s1",
      major_id: "m1",
      title: "Backend",
      is_core: true,
      cohort_year: 2025,
      score: 0.85,
      covered_count: 5,
      can_cover_count: 3,
      total_count: 10,
      completed_ids: ["c1"],
      can_cover_ids: ["c2"],
      cannot_cover_ids: ["c3"],
      mandatory_ids: ["c1", "c2"],
    };

    expect(normalizeSpecializationMatch(dto)).toEqual({
      id: "s1",
      majorId: "m1",
      title: "Backend",
      isCore: true,
      cohortYear: 2025,
      score: 0.85,
      coveredCount: 5,
      canCoverCount: 3,
      totalCount: 10,
      completedIds: ["c1"],
      canCoverIds: ["c2"],
      cannotCoverIds: ["c3"],
      mandatoryIds: ["c1", "c2"],
    });
  });
});
