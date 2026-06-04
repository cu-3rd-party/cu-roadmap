import { describe, expect, it } from "vitest";

import { getSemesterDateRange } from "../getSemesterDateRange";

describe("getSemesterDateRange", () => {
  it("returns fall range for odd semester", () => {
    expect(getSemesterDateRange(2026, 1)).toBe("Сентябрь 2026 - Январь 2027");
    expect(getSemesterDateRange(2025, 3)).toBe("Сентябрь 2026 - Январь 2027");
  });

  it("returns spring range for even semester", () => {
    expect(getSemesterDateRange(2026, 2)).toBe("Февраль 2027 - Июнь 2027");
    expect(getSemesterDateRange(2025, 4)).toBe("Февраль 2027 - Июнь 2027");
  });

  it("returns empty string for null admission year", () => {
    expect(getSemesterDateRange(null, 1)).toBe("");
  });
});
