import { afterEach, describe, expect, it } from "vitest";

import { isPathActive } from "../router";

const go = (path: string) => window.history.pushState({}, "", path);

afterEach(() => {
  go("/");
});

describe("isPathActive", () => {
  it("treats root as active only when the pathname is exactly /", () => {
    go("/");
    expect(isPathActive("/")).toBe(true);

    go("/courses");
    expect(isPathActive("/")).toBe(false);
  });

  it("matches a non-root path exactly", () => {
    go("/courses");
    expect(isPathActive("/courses")).toBe(true);
  });

  it("returns false for a non-matching path", () => {
    go("/planner");
    expect(isPathActive("/courses")).toBe(false);
  });
});
