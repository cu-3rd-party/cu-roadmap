import { describe, expect, it } from "vitest";

import type { PlannedCourse } from "../../model";
import { buildGenerateRoadmapRequest } from "../buildGenerateRoadmapRequest";

const course = (id: string): PlannedCourse => ({ id, title: id });

// admissionYear 2025 → current semester 3 → semesters 1,2 completed.
const YEAR = 2025;
const MAJOR = "major-1";
const SPEC = "spec-1";

describe("buildGenerateRoadmapRequest", () => {
  it("partitions completed semesters into passed_course_ids and the rest into selected_course_ids", () => {
    const selections: Record<number, PlannedCourse[]> = {
      1: [course("a"), course("b")],
      3: [course("c")],
      4: [course("d")],
    };

    const req = buildGenerateRoadmapRequest(
      selections,
      YEAR,
      MAJOR,
      SPEC,
      "selected",
      30,
    );

    expect(req.passed_course_ids).toEqual(["a", "b"]);
    expect(req.selected_course_ids).toEqual([
      { semester: 3, course_ids: ["c"] },
      { semester: 4, course_ids: ["d"] },
    ]);
  });

  it("skips empty semesters", () => {
    const req = buildGenerateRoadmapRequest(
      { 3: [], 4: [course("d")] },
      YEAR,
      MAJOR,
      SPEC,
      "selected",
      30,
    );
    expect(req.selected_course_ids).toEqual([
      { semester: 4, course_ids: ["d"] },
    ]);
  });

  it("processes semesters in ascending order regardless of key order", () => {
    const req = buildGenerateRoadmapRequest(
      { 4: [course("d")], 3: [course("c")] },
      YEAR,
      MAJOR,
      SPEC,
      "selected",
      30,
    );
    expect(req.selected_course_ids.map((s) => s.semester)).toEqual([3, 4]);
  });

  it("maps an empty specialization id to undefined and sets cohort/current_semester", () => {
    const req = buildGenerateRoadmapRequest(
      { 3: [course("c")] },
      YEAR,
      MAJOR,
      "",
      "selected",
      24,
    );
    expect(req.specialization_id).toBeUndefined();
    expect(req.major_id).toBe(MAJOR);
    expect(req.cohort).toBe(YEAR);
    expect(req.current_semester).toBe(3);
    expect(req.course_source).toBe("selected");
    expect(req.max_load).toBe(24);
  });
});
