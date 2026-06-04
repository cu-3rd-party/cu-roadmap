import { describe, expect, it } from "vitest";

import { isSemesterCompleted } from "../isSemesterCompleted";

describe("isSemesterCompleted", () => {
  // admissionYear 2025 → current semester is 3 → semesters 1,2 are completed
  it("returns true for semester before current", () => {
    expect(isSemesterCompleted(1, 2025)).toBe(true);
  });

  it("returns false for current semester", () => {
    expect(isSemesterCompleted(3, 2025)).toBe(false);
  });

  it("returns false for future semester", () => {
    expect(isSemesterCompleted(4, 2025)).toBe(false);
  });
});
