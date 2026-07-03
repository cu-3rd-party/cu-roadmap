import { describe, expect, it } from "vitest";

import { wrapLabel } from "../wrapLabel";

describe("wrapLabel", () => {
  it("returns a single short word unchanged", () => {
    expect(wrapLabel("Course")).toBe("Course");
  });

  it("keeps words on one line while they fit under maxLen", () => {
    // "abc def" = 7 chars, under the default 12.
    expect(wrapLabel("abc def")).toBe("abc def");
  });

  it("wraps to a new line once the max length is exceeded", () => {
    // "hello world" = 11 (fits); adding "again" pushes past 12.
    expect(wrapLabel("hello world again")).toBe("hello world\nagain");
  });

  it("respects a custom maxLen", () => {
    expect(wrapLabel("one two three", 3)).toBe("one\ntwo\nthree");
  });

  it("collapses and ignores leading/repeated whitespace", () => {
    expect(wrapLabel("   spaced    out   ")).toBe("spaced out");
  });

  it("returns an empty string for empty input", () => {
    expect(wrapLabel("")).toBe("");
    expect(wrapLabel("   ")).toBe("");
  });

  it("puts a word longer than maxLen on its own line", () => {
    expect(wrapLabel("supercalifragilistic word", 12)).toBe(
      "supercalifragilistic\nword",
    );
  });
});
