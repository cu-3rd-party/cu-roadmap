import { describe, expect, it } from "vitest";

import type { Major } from "@/entities/major";

import { resolveMajorId } from "../useResyncMajor";

const major = (id: string, type: Major["type"]): Major => ({
  id,
  title: type,
  type,
  cohortYear: 2025,
});

const majors: Major[] = [major("swe-1", "swe"), major("ai-1", "ai")];

describe("resolveMajorId", () => {
  it("adopts the fresh id when the saved type exists under a different id", () => {
    expect(resolveMajorId(majors, "swe", "stale-id")).toBe("swe-1");
  });

  it("returns null when the id already matches (idempotent)", () => {
    expect(resolveMajorId(majors, "swe", "swe-1")).toBeNull();
  });

  it("returns null when no major of that type is offered", () => {
    expect(resolveMajorId(majors, "business", "stale-id")).toBeNull();
  });

  it("returns null when majors are not loaded yet", () => {
    expect(resolveMajorId(undefined, "swe", "stale-id")).toBeNull();
  });

  it("returns null when no type is saved (legacy user)", () => {
    expect(resolveMajorId(majors, null, "swe-1")).toBeNull();
  });
});
