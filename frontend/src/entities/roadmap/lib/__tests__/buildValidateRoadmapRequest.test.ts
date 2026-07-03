import { describe, expect, it } from "vitest";

import type { PlannedCourse } from "../../model";
import { buildValidateRoadmapRequest } from "../buildValidateRoadmapRequest";

const course = (id: string): PlannedCourse => ({ id, title: id });

describe("buildValidateRoadmapRequest", () => {
  it("collapses selections into ascending roadmap segments, skipping empty semesters", () => {
    const req = buildValidateRoadmapRequest(
      {
        4: [course("d")],
        1: [course("a"), course("b")],
        3: [],
      },
      2025,
    );

    expect(req.roadmap).toEqual([
      { semester: 1, course_ids: ["a", "b"] },
      { semester: 4, course_ids: ["d"] },
    ]);
  });

  it("sets current_semester from the admission year", () => {
    const req = buildValidateRoadmapRequest({ 1: [course("a")] }, 2024);
    // admissionYear 2024 → current semester 5
    expect(req.current_semester).toBe(5);
  });

  it("returns an empty roadmap for no selections", () => {
    const req = buildValidateRoadmapRequest({}, 2026);
    expect(req.roadmap).toEqual([]);
    expect(req.current_semester).toBe(1);
  });
});
