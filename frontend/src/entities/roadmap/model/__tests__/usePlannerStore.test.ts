import { beforeEach, describe, expect, it } from "vitest";

import type { SemesterValidation } from "../domain";
import type { CourseCatalogInfo, PlannedCourse } from "../types";
import { usePlannerStore } from "../usePlannerStore";

// Reset the data slices between tests without dropping the action functions
// (a `replace` setState would wipe the actions too).
const resetStore = () =>
  usePlannerStore.setState({
    selections: {},
    validation: [],
    generatedIds: new Set<string>(),
  });

const course = (
  id: string,
  over: Partial<PlannedCourse> = {},
): PlannedCourse => ({
  id,
  title: `Course ${id}`,
  category: "ai",
  type: "core",
  ...over,
});

const catalogInfo = (
  id: string,
  over: Partial<CourseCatalogInfo> = {},
): CourseCatalogInfo => ({
  id,
  title: `Course ${id}`,
  category: "ai",
  type: "core",
  fixedSemester: 0,
  ...over,
});

beforeEach(() => {
  resetStore();
});

describe("addCourse", () => {
  it("adds a course to an empty semester", () => {
    usePlannerStore.getState().addCourse(1, course("a"));
    expect(usePlannerStore.getState().selections[1]).toEqual([course("a")]);
  });

  it("ignores a duplicate id in the same semester", () => {
    const { addCourse } = usePlannerStore.getState();
    addCourse(1, course("a"));
    const before = usePlannerStore.getState().selections;
    addCourse(1, course("a", { title: "different" }));
    // state object unchanged — the dup guard returns the same state
    expect(usePlannerStore.getState().selections).toBe(before);
    expect(usePlannerStore.getState().selections[1]).toHaveLength(1);
  });
});

describe("removeCourse", () => {
  it("removes a non-fixed course", () => {
    usePlannerStore.setState({ selections: { 1: [course("a"), course("b")] } });
    usePlannerStore.getState().removeCourse(1, "a");
    expect(usePlannerStore.getState().selections[1]).toEqual([course("b")]);
  });

  it("refuses to remove a fixed course", () => {
    usePlannerStore.setState({
      selections: { 1: [course("a", { fixed: true })] },
    });
    const before = usePlannerStore.getState().selections;
    usePlannerStore.getState().removeCourse(1, "a");
    expect(usePlannerStore.getState().selections).toBe(before);
  });

  it("clears the generated highlight for the removed course", () => {
    usePlannerStore.setState({
      selections: { 1: [course("a")] },
      generatedIds: new Set(["a", "b"]),
    });
    usePlannerStore.getState().removeCourse(1, "a");
    expect([...usePlannerStore.getState().generatedIds]).toEqual(["b"]);
  });
});

describe("moveCourse", () => {
  it("is a no-op when from === to", () => {
    usePlannerStore.setState({ selections: { 1: [course("a")] } });
    const before = usePlannerStore.getState().selections;
    usePlannerStore.getState().moveCourse(1, 1, "a");
    expect(usePlannerStore.getState().selections).toBe(before);
  });

  it("moves a course between semesters", () => {
    usePlannerStore.setState({ selections: { 1: [course("a")] } });
    usePlannerStore.getState().moveCourse(1, 2, "a");
    const { selections } = usePlannerStore.getState();
    expect(selections[1]).toEqual([]);
    expect(selections[2]).toEqual([course("a")]);
  });

  it("refuses to move a fixed course", () => {
    usePlannerStore.setState({
      selections: { 1: [course("a", { fixed: true })] },
    });
    const before = usePlannerStore.getState().selections;
    usePlannerStore.getState().moveCourse(1, 2, "a");
    expect(usePlannerStore.getState().selections).toBe(before);
  });

  it("dedups when the course already exists in the target semester", () => {
    usePlannerStore.setState({
      selections: { 1: [course("a")], 2: [course("a")] },
    });
    usePlannerStore.getState().moveCourse(1, 2, "a");
    const { selections } = usePlannerStore.getState();
    expect(selections[1]).toEqual([]);
    expect(selections[2]).toHaveLength(1);
  });

  it("clears the generated highlight on a cross-semester move", () => {
    usePlannerStore.setState({
      selections: { 1: [course("a")] },
      generatedIds: new Set(["a"]),
    });
    usePlannerStore.getState().moveCourse(1, 2, "a");
    expect(usePlannerStore.getState().generatedIds.has("a")).toBe(false);
  });
});

describe("clearSemester", () => {
  it("removes non-fixed courses and deletes the empty key", () => {
    usePlannerStore.setState({ selections: { 1: [course("a"), course("b")] } });
    usePlannerStore.getState().clearSemester(1);
    expect(usePlannerStore.getState().selections[1]).toBeUndefined();
  });

  it("keeps fixed courses", () => {
    usePlannerStore.setState({
      selections: { 1: [course("a", { fixed: true }), course("b")] },
    });
    usePlannerStore.getState().clearSemester(1);
    expect(usePlannerStore.getState().selections[1]).toEqual([
      course("a", { fixed: true }),
    ]);
  });
});

describe("reorderCourses", () => {
  it("reorders within a semester", () => {
    usePlannerStore.setState({
      selections: { 1: [course("a"), course("b"), course("c")] },
    });
    usePlannerStore.getState().reorderCourses(1, "a", "c");
    expect(usePlannerStore.getState().selections[1].map((c) => c.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("is a no-op when active === over", () => {
    usePlannerStore.setState({ selections: { 1: [course("a")] } });
    const before = usePlannerStore.getState().selections;
    usePlannerStore.getState().reorderCourses(1, "a", "a");
    expect(usePlannerStore.getState().selections).toBe(before);
  });
});

describe("setValidation", () => {
  it("drops the generated highlight for conflicted courses", () => {
    usePlannerStore.setState({ generatedIds: new Set(["a", "b"]) });
    const validation: SemesterValidation[] = [
      {
        semester: 1,
        valid: false,
        totalLoad: 0,
        messages: [{ level: "error", message: "conflict", courseId: "a" }],
      },
    ];
    usePlannerStore.getState().setValidation(validation);
    expect([...usePlannerStore.getState().generatedIds]).toEqual(["b"]);
  });
});

describe("reset", () => {
  beforeEach(() => {
    usePlannerStore.setState({
      selections: {
        1: [course("a")],
        2: [course("b", { fixed: true }), course("c")],
        3: [course("d", { fixed: true })],
      },
    });
  });

  it("wipes everything by default (no cutoff), keeping fixed courses", () => {
    usePlannerStore.getState().reset();
    expect(usePlannerStore.getState().selections).toEqual({
      2: [course("b", { fixed: true })],
      3: [course("d", { fixed: true })],
    });
  });

  it("keeps whole semesters below the cutoff", () => {
    usePlannerStore.getState().reset(3);
    const { selections } = usePlannerStore.getState();
    // semesters 1 & 2 are below cutoff 3 → kept whole
    expect(selections[1]).toEqual([course("a")]);
    expect(selections[2]).toEqual([course("b", { fixed: true }), course("c")]);
    // semester 3 is at/above cutoff → only fixed survives
    expect(selections[3]).toEqual([course("d", { fixed: true })]);
  });

  it("performs a full wipe when keepFixed is false", () => {
    usePlannerStore.getState().reset(undefined, false);
    expect(usePlannerStore.getState().selections).toEqual({});
  });

  it("clears validation and generated ids", () => {
    usePlannerStore.setState({
      validation: [{ semester: 1, valid: true, totalLoad: 0, messages: [] }],
      generatedIds: new Set(["x"]),
    });
    usePlannerStore.getState().reset();
    expect(usePlannerStore.getState().validation).toEqual([]);
    expect(usePlannerStore.getState().generatedIds.size).toBe(0);
  });
});

describe("resyncSelections", () => {
  it("refreshes denormalized fields from the catalog", () => {
    usePlannerStore.setState({
      selections: { 1: [course("a", { title: "stale", category: "soft" })] },
    });
    usePlannerStore
      .getState()
      .resyncSelections([catalogInfo("a", { title: "fresh", category: "ai" })]);
    expect(usePlannerStore.getState().selections[1][0]).toMatchObject({
      title: "fresh",
      category: "ai",
    });
  });

  it("promotes a course to fixed when the catalog pins it to that semester", () => {
    usePlannerStore.setState({ selections: { 2: [course("a")] } });
    usePlannerStore
      .getState()
      .resyncSelections([catalogInfo("a", { fixedSemester: 2 })]);
    expect(usePlannerStore.getState().selections[2][0].fixed).toBe(true);
  });

  it("relocates a fixed course out of the wrong semester into its fixed one", () => {
    usePlannerStore.setState({ selections: { 1: [course("a")] } });
    usePlannerStore
      .getState()
      .resyncSelections([catalogInfo("a", { fixedSemester: 3 })]);
    const { selections } = usePlannerStore.getState();
    expect(selections[1]).toBeUndefined();
    expect(selections[3]?.[0]).toMatchObject({ id: "a", fixed: true });
  });

  it("adds a fixed course that isn't placed yet", () => {
    usePlannerStore.setState({ selections: {} });
    usePlannerStore
      .getState()
      .resyncSelections([catalogInfo("a", { fixedSemester: 4 })]);
    expect(usePlannerStore.getState().selections[4]?.[0]).toMatchObject({
      id: "a",
      fixed: true,
    });
  });

  it("leaves courses absent from the catalog untouched", () => {
    const snapshot = course("ghost", { title: "from another major" });
    usePlannerStore.setState({ selections: { 1: [snapshot] } });
    usePlannerStore.getState().resyncSelections([catalogInfo("other")]);
    expect(usePlannerStore.getState().selections[1]).toContainEqual(snapshot);
  });

  it("is idempotent — a second resync returns the same selections reference", () => {
    usePlannerStore.setState({ selections: { 1: [course("a")] } });
    const catalog = [catalogInfo("a", { title: "fresh" })];
    usePlannerStore.getState().resyncSelections(catalog);
    const afterFirst = usePlannerStore.getState().selections;
    usePlannerStore.getState().resyncSelections(catalog);
    expect(usePlannerStore.getState().selections).toBe(afterFirst);
  });
});
