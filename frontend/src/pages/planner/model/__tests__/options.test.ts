import { describe, expect, it } from "vitest";

import { TOTAL_SEMESTERS } from "@/shared/constants";

import { buildPlannerStats, buildSemesters } from "../options";

describe("buildPlannerStats", () => {
  it("reports selected count, conflicts and average load (count / 8)", () => {
    expect(buildPlannerStats(16, 2)).toEqual([
      { label: "Курсов выбрано", value: 16 },
      { label: "Конфликты", value: 2 },
      { label: "Средняя нагрузка", value: 2 },
    ]);
  });

  it("handles zero courses", () => {
    expect(buildPlannerStats(0, 0)).toEqual([
      { label: "Курсов выбрано", value: 0 },
      { label: "Конфликты", value: 0 },
      { label: "Средняя нагрузка", value: 0 },
    ]);
  });
});

describe("buildSemesters", () => {
  it("returns one 1-based index entry per semester", () => {
    const semesters = buildSemesters();
    expect(semesters).toHaveLength(TOTAL_SEMESTERS);
    expect(semesters.map((s) => s.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
