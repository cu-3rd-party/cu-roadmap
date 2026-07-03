import { describe, expect, it } from "vitest";

import type {
  GenerateRoadmapResponseDto,
  ValidateRoadmapResponseDto,
} from "../../api";
import {
  normalizeRoadmap,
  normalizeValidationResult,
  normalizeValidationRoadmap,
} from "../normalizeRoadmap";

describe("normalizeRoadmap", () => {
  it("maps the roadmap semesters from snake_case to camelCase", () => {
    const dto: GenerateRoadmapResponseDto = {
      major_id: "m1",
      roadmap: [
        { semester: 1, total_load: 12, course_ids: ["a", "b"] },
        { semester: 2, total_load: 6, course_ids: ["c"] },
      ],
    };
    expect(normalizeRoadmap(dto)).toEqual({
      error: undefined,
      semesters: [
        { semester: 1, totalLoad: 12, courseIds: ["a", "b"] },
        { semester: 2, totalLoad: 6, courseIds: ["c"] },
      ],
    });
  });

  it("propagates the error and defaults a missing roadmap to an empty list", () => {
    const dto = {
      error: "no path",
      roadmap: undefined,
    } as unknown as GenerateRoadmapResponseDto;
    expect(normalizeRoadmap(dto)).toEqual({ error: "no path", semesters: [] });
  });
});

describe("normalizeValidationResult", () => {
  it("maps a validation result and defaults missing messages", () => {
    expect(
      normalizeValidationResult({
        semester: 3,
        valid: true,
        total_load: 10,
        messages: undefined as never,
      }),
    ).toEqual({ semester: 3, valid: true, totalLoad: 10, messages: [] });
  });

  it("maps message course_id through to courseId", () => {
    const result = normalizeValidationResult({
      semester: 1,
      valid: false,
      total_load: 0,
      messages: [{ level: "error", message: "conflict", course_id: "x" }],
    });
    expect(result.messages).toEqual([
      { level: "error", message: "conflict", courseId: "x" },
    ]);
  });
});

describe("normalizeValidationRoadmap", () => {
  it("maps each validation result", () => {
    const dto: ValidateRoadmapResponseDto = {
      validation_results: [
        { semester: 1, valid: true, total_load: 5, messages: [] },
      ],
    };
    expect(normalizeValidationRoadmap(dto)).toHaveLength(1);
    expect(normalizeValidationRoadmap(dto)[0].semester).toBe(1);
  });

  it("defaults missing results to an empty array", () => {
    expect(
      normalizeValidationRoadmap({
        validation_results: undefined,
      } as unknown as ValidateRoadmapResponseDto),
    ).toEqual([]);
  });
});
