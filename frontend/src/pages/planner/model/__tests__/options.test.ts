import { describe, expect, it } from "vitest";

import { TOTAL_SEMESTERS } from "@/shared/constants";

import { buildSemesters } from "../options";

describe("buildSemesters", () => {
  it("returns one 1-based index entry per semester", () => {
    const semesters = buildSemesters();
    expect(semesters).toHaveLength(TOTAL_SEMESTERS);
    expect(semesters.map((s) => s.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
