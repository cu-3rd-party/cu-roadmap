import { describe, expect, it } from "vitest";

import { cn } from "../cn";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false, "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts (later wins)", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("handles undefined and null inputs", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  it("returns empty string for no args", () => {
    expect(cn()).toBe("");
  });
});
