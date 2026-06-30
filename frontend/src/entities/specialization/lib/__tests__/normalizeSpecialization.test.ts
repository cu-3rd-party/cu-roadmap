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
      cohort_year: 2025,
      score: 0.85,
      covered_count: 5,
      can_cover_count: 3,
      total_count: 10,
      covered_courses: [{ course_id: "c1", title: "Algorithms" }],
      can_cover_courses: [{ course_id: "c2", title: "Databases" }],
      cannot_cover_courses: [{ course_id: "c3", title: "Compilers" }],
    };

    expect(normalizeSpecializationMatch(dto)).toEqual({
      id: "s1",
      majorId: "m1",
      title: "Backend",
      cohortYear: 2025,
      score: 0.85,
      coveredCount: 5,
      canCoverCount: 3,
      totalCount: 10,
      coveredCourses: [{ courseId: "c1", title: "Algorithms" }],
      canCoverCourses: [{ courseId: "c2", title: "Databases" }],
      cannotCoverCourses: [{ courseId: "c3", title: "Compilers" }],
    });
  });
});
