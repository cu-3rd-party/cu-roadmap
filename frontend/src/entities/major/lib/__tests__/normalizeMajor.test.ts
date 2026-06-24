import { describe, expect, it } from "vitest";

import type { MajorDto, MajorMatchDto } from "../../api";
import { normalizeMajor, normalizeMajorMatch } from "../normalizeMajor";

describe("normalizeMajor", () => {
  it("converts snake_case dto to camelCase domain model", () => {
    const dto: MajorDto = {
      id: "1",
      title: "Software Engineering",
      internal_name: "swe",
      cohort_year: 2025,
      requirements: [
        { course_id: "c1", requirement_type: "major_core" },
        { course_id: "c2", requirement_type: "flex" },
      ],
    };

    const result = normalizeMajor(dto);

    expect(result).toEqual({
      id: "1",
      title: "Software Engineering",
      type: "swe",
      cohortYear: 2025,
    });
  });
});

describe("normalizeMajorMatch", () => {
  it("converts snake_case dto to camelCase", () => {
    const dto: MajorMatchDto = {
      id: "m1",
      title: "Business",
      score: 0.85,
      covered_count: 5,
      can_cover_count: 3,
      total_count: 10,
    };

    expect(normalizeMajorMatch(dto)).toEqual({
      id: "m1",
      title: "Business",
      score: 0.85,
      coveredCount: 5,
      canCoverCount: 3,
      totalCount: 10,
    });
  });
});
