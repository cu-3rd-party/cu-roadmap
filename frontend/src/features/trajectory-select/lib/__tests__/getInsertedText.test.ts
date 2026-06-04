import { describe, expect, it } from "vitest";

import { getInsertedText } from "../getInsertedText";

describe("getInsertedText", () => {
  it("detects appended character", () => {
    expect(getInsertedText("hel", "hell")).toBe("l");
  });

  it("detects inserted text in the middle", () => {
    expect(getInsertedText("hello", "heXllo")).toBe("X");
  });

  it("detects prepended text", () => {
    expect(getInsertedText("world", "hello world")).toBe("hello ");
  });

  it("returns entire string when prev is empty", () => {
    expect(getInsertedText("", "hello")).toBe("hello");
  });

  it("returns empty string when texts are identical", () => {
    expect(getInsertedText("same", "same")).toBe("");
  });

  it("handles replacement", () => {
    expect(getInsertedText("abc", "xyz")).toBe("xyz");
  });
});
