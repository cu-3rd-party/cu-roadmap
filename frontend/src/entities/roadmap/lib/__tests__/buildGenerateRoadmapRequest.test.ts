import { describe, expect, it } from "vitest";

import type { PlannedCourse } from "../../model";
import { buildGenerateRoadmapRequest } from "../buildGenerateRoadmapRequest";

const makeCourse = (id: string): PlannedCourse => ({
  id,
  title: `Course ${id}`,
});

describe("buildGenerateRoadmapRequest", () => {
  // admissionYear 2025 → current semester is 3 → only semesters 1,2 are completed
  it("collects course ids from completed semesters with scope 'completed'", () => {
    const selections: Record<number, PlannedCourse[]> = {
      1: [makeCourse("c1")],
      2: [makeCourse("c2")],
      3: [makeCourse("c3")],
    };

    const result = buildGenerateRoadmapRequest(
      selections,
      2025,
      "major-1",
      "completed",
    );

    expect(result.passed_course_ids).toEqual(["c1", "c2"]);
    expect(result.major_id).toBe("major-1");
    expect(result.cohort).toBe(2025);
    expect(result.current_semester).toBe(3);
  });

  it("collects all course ids with scope 'all'", () => {
    const selections: Record<number, PlannedCourse[]> = {
      1: [makeCourse("c1")],
      2: [makeCourse("c2")],
    };

    const result = buildGenerateRoadmapRequest(
      selections,
      2026,
      "major-1",
      "all",
    );

    expect(result.passed_course_ids).toEqual(["c1", "c2"]);
  });

  it("returns empty ids for empty selections", () => {
    const result = buildGenerateRoadmapRequest({}, 2026, "major-1", "all");

    expect(result.passed_course_ids).toEqual([]);
  });

  it("skips semesters with no courses", () => {
    const selections: Record<number, PlannedCourse[]> = {
      1: [],
      2: [makeCourse("c2")],
    };

    const result = buildGenerateRoadmapRequest(
      selections,
      2025,
      "major-1",
      "completed",
    );

    expect(result.passed_course_ids).toEqual(["c2"]);
  });
});
