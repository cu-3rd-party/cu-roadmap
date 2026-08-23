import { describe, expect, it } from "vitest";

import type { CourseDependency } from "@/entities/course";

import {
  addRequisite,
  buildRequisiteCards,
  removeRequisiteCard,
} from "../requisiteCards";

const COURSE = "course-under-edit";

const row = (over: Partial<CourseDependency> = {}): CourseDependency => ({
  id: "r1",
  courseId: COURSE,
  requiredCourseId: "c1",
  requiredGroupId: null,
  type: "prerequisite",
  alternativeGroup: 0,
  ...over,
});

describe("buildRequisiteCards", () => {
  it("gives each plain course row its own card", () => {
    const cards = buildRequisiteCards(
      [
        row({ id: "r1", requiredCourseId: "c1" }),
        row({ id: "r2", requiredCourseId: "c2" }),
      ],
      "prerequisite",
    );

    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(cards.every((c) => c.kind === "course")).toBe(true);
  });

  it("collapses an alternative group into one box card", () => {
    // "выбор 1 из 2": two rows, same group, same positive alternative_group.
    const cards = buildRequisiteCards(
      [
        row({
          id: "r1",
          requiredCourseId: "c1",
          requiredGroupId: "g1",
          alternativeGroup: 1,
        }),
        row({
          id: "r2",
          requiredCourseId: "c2",
          requiredGroupId: "g1",
          alternativeGroup: 1,
        }),
      ],
      "prerequisite",
    );

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ kind: "group", id: "g1" });
    expect(cards[0].rowIds).toEqual(["r1", "r2"]);
  });

  it("separates prerequisites from corequisites", () => {
    const rows = [
      row({ id: "r1", requiredCourseId: "c1", type: "prerequisite" }),
      row({ id: "r2", requiredCourseId: "c2", type: "corequisite" }),
    ];

    expect(buildRequisiteCards(rows, "prerequisite").map((c) => c.id)).toEqual([
      "c1",
    ]);
    expect(buildRequisiteCards(rows, "corequisite").map((c) => c.id)).toEqual([
      "c2",
    ]);
  });

  it("drops rows that identify nothing", () => {
    expect(
      buildRequisiteCards(
        [row({ requiredCourseId: null, requiredGroupId: null })],
        "prerequisite",
      ),
    ).toEqual([]);
  });
});

describe("removeRequisiteCard", () => {
  it("drops every row behind the card, not just the first", () => {
    const rows = [
      row({ id: "r1", requiredGroupId: "g1", alternativeGroup: 1 }),
      row({ id: "r2", requiredGroupId: "g1", alternativeGroup: 1 }),
      row({ id: "r3", requiredCourseId: "c9" }),
    ];
    const [boxCard] = buildRequisiteCards(rows, "prerequisite");

    expect(removeRequisiteCard(rows, boxCard).map((r) => r.id)).toEqual(["r3"]);
  });
});

describe("addRequisite", () => {
  it("appends a course row as a plain requirement", () => {
    const next = addRequisite([], COURSE, "prerequisite", {
      kind: "course",
      id: "c1",
    });

    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({
      courseId: COURSE,
      requiredCourseId: "c1",
      requiredGroupId: null,
      type: "prerequisite",
      alternativeGroup: 0,
    });
  });

  it("appends a group row with the group id set instead", () => {
    const next = addRequisite([], COURSE, "corequisite", {
      kind: "group",
      id: "g1",
    });

    expect(next[0]).toMatchObject({
      requiredCourseId: null,
      requiredGroupId: "g1",
      type: "corequisite",
    });
  });

  it("gives each added row a distinct id", () => {
    let rows = addRequisite([], COURSE, "prerequisite", {
      kind: "course",
      id: "c1",
    });
    rows = addRequisite(rows, COURSE, "prerequisite", {
      kind: "course",
      id: "c2",
    });

    expect(new Set(rows.map((r) => r.id)).size).toBe(2);
  });

  it("ignores a duplicate", () => {
    const rows = addRequisite([], COURSE, "prerequisite", {
      kind: "course",
      id: "c1",
    });
    expect(
      addRequisite(rows, COURSE, "prerequisite", { kind: "course", id: "c1" }),
    ).toBe(rows);
  });

  it("lets the same course be both a prerequisite and a corequisite", () => {
    const rows = addRequisite([], COURSE, "prerequisite", {
      kind: "course",
      id: "c1",
    });
    expect(
      addRequisite(rows, COURSE, "corequisite", { kind: "course", id: "c1" }),
    ).toHaveLength(2);
  });
});
