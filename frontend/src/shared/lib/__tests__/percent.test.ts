import { describe, expect, it } from "vitest";

import { toPercent } from "../percent";

describe("toPercent", () => {
  it("returns 0 when total is 0", () => {
    expect(toPercent(5, 0)).toBe(0);
  });

  it("calculates correct percentage", () => {
    expect(toPercent(25, 100)).toBe(25);
    expect(toPercent(50, 200)).toBe(25);
    expect(toPercent(1, 3)).toBe(33);
  });

  it("returns 100 for full amount", () => {
    expect(toPercent(100, 100)).toBe(100);
  });

  it("returns 0 for zero count", () => {
    expect(toPercent(0, 100)).toBe(0);
  });

  it("rounds to nearest integer", () => {
    expect(toPercent(1, 6)).toBe(17);
  });
});
