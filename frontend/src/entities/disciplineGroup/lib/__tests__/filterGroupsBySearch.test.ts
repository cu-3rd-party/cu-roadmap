import { describe, expect, it } from "vitest";

import type { DisciplineGroup } from "../../model/types";
import { filterGroupsBySearch } from "../filterGroupsBySearch";

const group = (over: Partial<DisciplineGroup> = {}): DisciplineGroup => ({
  id: "g1",
  title: "Коробка математики",
  category: "prerequisite",
  rootBoxId: "b1",
  expression: {
    type: "logical",
    logicalOp: "or",
    minCount: 1,
    maxCount: null,
    courseId: null,
    title: "",
    children: [],
  },
  ...over,
});

describe("filterGroupsBySearch", () => {
  const groups = [
    group({ id: "g1", title: "Коробка математики" }),
    group({ id: "g2", title: "Коробка физики" }),
  ];

  it("returns everything for an empty query", () => {
    expect(filterGroupsBySearch(groups, "   ").map((g) => g.id)).toEqual([
      "g1",
      "g2",
    ]);
  });

  it("matches the title case-insensitively", () => {
    expect(filterGroupsBySearch(groups, "ФИЗИКИ").map((g) => g.id)).toEqual([
      "g2",
    ]);
  });

  it("matches on a substring, not just a prefix", () => {
    expect(filterGroupsBySearch(groups, "коробка").map((g) => g.id)).toEqual([
      "g1",
      "g2",
    ]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterGroupsBySearch(groups, "химии")).toEqual([]);
  });
});
