import { describe, expect, it } from "vitest";

import type { PlannedCourse } from "../../model";
import { buildGoalPathRequest } from "../buildGoalPathRequest";

const course = (id: string): PlannedCourse => ({ id, title: id });

// admissionYear 2025 → current semester 3 → semesters 1,2 completed.
const YEAR = 2025;
const TARGET = "target-course";

describe("buildGoalPathRequest", () => {
  it("collects passed_course_ids only from completed semesters", () => {
    const selections: Record<number, PlannedCourse[]> = {
      1: [course("a"), course("b")],
      2: [course("c")],
      3: [course("d")],
      4: [course("e")],
    };

    const req = buildGoalPathRequest(selections, YEAR, TARGET);

    expect(req.passed_course_ids).toEqual(["a", "b", "c"]);
  });

  it("skips empty semesters", () => {
    const req = buildGoalPathRequest({ 1: [], 2: [course("c")] }, YEAR, TARGET);
    expect(req.passed_course_ids).toEqual(["c"]);
  });

  it("processes semesters in ascending order regardless of key order", () => {
    const req = buildGoalPathRequest(
      { 2: [course("c")], 1: [course("a")] },
      YEAR,
      TARGET,
    );
    expect(req.passed_course_ids).toEqual(["a", "c"]);
  });

  it("sets target, current_semester and the constant max_load", () => {
    const req = buildGoalPathRequest({ 1: [course("a")] }, YEAR, TARGET);

    expect(req.target_course_id).toBe(TARGET);
    expect(req.current_semester).toBe(3);
    expect(req.max_load).toBe(60);
  });

  it("passes through goal_semester when given", () => {
    const req = buildGoalPathRequest({}, YEAR, TARGET, 5);
    expect(req.goal_semester).toBe(5);
  });

  it("leaves goal_semester undefined when omitted", () => {
    const req = buildGoalPathRequest({}, YEAR, TARGET);
    expect(req.goal_semester).toBeUndefined();
    expect(req.passed_course_ids).toEqual([]);
  });
});
