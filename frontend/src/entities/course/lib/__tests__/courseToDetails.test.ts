import { describe, expect, it } from "vitest";

import type { Course } from "../../model";
import {
  buildCourseTitleMap,
  courseToDetails,
  semestersToSeasons,
} from "../courseToDetails";

const baseCourse = (over: Partial<Course> = {}): Course => ({
  id: "c1",
  title: "Algorithms",
  description: "desc",
  type: "core",
  category: "ai",
  handbookLink: "https://x.test",
  availableSemesters: [1, 2],
  workload: 5,
  ...over,
});

const noLookups = {
  titleMap: new Map<string, string>(),
  specializationTitleMap: new Map<string, string>(),
};

describe("buildCourseTitleMap", () => {
  it("builds an id→title map", () => {
    const map = buildCourseTitleMap([
      baseCourse({ id: "a", title: "A" }),
      baseCourse({ id: "b", title: "B" }),
    ]);
    expect(map.get("a")).toBe("A");
    expect(map.get("b")).toBe("B");
  });
});

describe("semestersToSeasons", () => {
  it("maps odd semesters to autumn and even to spring", () => {
    expect(semestersToSeasons([1, 2])).toEqual(["autumn", "spring"]);
  });

  it("dedups repeated seasons", () => {
    expect(semestersToSeasons([1, 3])).toEqual(["autumn"]);
  });

  it("returns an empty array for undefined", () => {
    expect(semestersToSeasons(undefined)).toEqual([]);
  });
});

describe("courseToDetails", () => {
  it("appends the type label to the category for core/choice courses", () => {
    const details = courseToDetails(
      baseCourse({ type: "core", category: "ai" }),
      noLookups,
    );
    expect(details.category).toBe("AI Core");
  });

  it("uses the bare category label for non-core/choice courses", () => {
    const details = courseToDetails(
      baseCourse({ type: "elective", category: "ai" }),
      noLookups,
    );
    expect(details.category).toBe("AI");
  });

  it("formats a single admission year as the year itself", () => {
    expect(
      courseToDetails(baseCourse({ allowedCohorts: [2025] }), noLookups)
        .admissionYears,
    ).toBe("2025");
  });

  it("formats a range of admission years as min–max", () => {
    expect(
      courseToDetails(
        baseCourse({ allowedCohorts: [2026, 2024, 2025] }),
        noLookups,
      ).admissionYears,
    ).toBe("2024–2026");
  });

  it("falls back when admission years are absent", () => {
    expect(
      courseToDetails(baseCourse({ allowedCohorts: undefined }), noLookups)
        .admissionYears,
    ).toBe("Не указан");
  });

  it("resolves prerequisite groups against the title map, dropping unknown ids and empty groups", () => {
    const titleMap = new Map([
      ["p1", "Prereq One"],
      ["p2", "Prereq Two"],
    ]);
    const details = courseToDetails(
      baseCourse({
        prerequisites: [
          { groupId: "g1", courses: ["p1", "unknown"] },
          { groupId: "g2", courses: ["nope"] }, // resolves to nothing -> dropped
        ],
      }),
      { titleMap, specializationTitleMap: new Map() },
    );
    expect(details.prerequisites).toEqual([
      { groupId: "g1", prerequisites: [{ id: "p1", title: "Prereq One" }] },
    ]);
  });

  it("resolves post/corequisites and skips ids missing from the title map", () => {
    const titleMap = new Map([["x", "Known"]]);
    const details = courseToDetails(
      baseCourse({ postrequisites: ["x", "missing"], corequisites: ["x"] }),
      { titleMap, specializationTitleMap: new Map() },
    );
    expect(details.postrequisites).toEqual([{ id: "x", title: "Known" }]);
    expect(details.corequisites).toEqual([{ id: "x", title: "Known" }]);
  });
});
