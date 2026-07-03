import { describe, expect, it } from "vitest";

import { sortKey } from "../sort";

describe("sortKey", () => {
  it("strips a leading number-and-punctuation prefix", () => {
    expect(sortKey("1. Course")).toBe("Course");
    expect(sortKey("10) Databases")).toBe("Databases");
  });

  it("strips leading whitespace and symbols", () => {
    expect(sortKey("   Algebra")).toBe("Algebra");
    expect(sortKey("«Курс»")).toBe("Курс»");
  });

  it("keeps a leading Latin letter", () => {
    expect(sortKey("Algorithms")).toBe("Algorithms");
  });

  it("keeps a leading Cyrillic letter, including ё/Ё", () => {
    expect(sortKey("Ёжик")).toBe("Ёжик");
    expect(sortKey("Курс")).toBe("Курс");
  });

  it("returns an empty string when there are no letters", () => {
    expect(sortKey("123 !!!")).toBe("");
  });
});
