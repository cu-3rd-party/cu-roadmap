import { beforeEach, describe, expect, it } from "vitest";

import { createCourseFiltersStore } from "../createCourseFiltersStore";
import { EMPTY_FILTERS } from "../options";

beforeEach(() => {
  localStorage.clear();
});

describe("createCourseFiltersStore (transient)", () => {
  it("starts from EMPTY_FILTERS", () => {
    const store = createCourseFiltersStore();
    expect(store.getState().filters).toEqual(EMPTY_FILTERS);
  });

  it("toggleType adds then removes a value", () => {
    const store = createCourseFiltersStore();
    store.getState().toggleType("core");
    expect(store.getState().filters.types).toEqual(["core"]);
    store.getState().toggleType("core");
    expect(store.getState().filters.types).toEqual([]);
  });

  it("toggleSemester adds then removes a value", () => {
    const store = createCourseFiltersStore();
    store.getState().toggleSemester("1");
    store.getState().toggleSemester("2");
    expect(store.getState().filters.semesters).toEqual(["1", "2"]);
    store.getState().toggleSemester("1");
    expect(store.getState().filters.semesters).toEqual(["2"]);
  });

  it("setGroup changes the group and resets the sub-selection to all", () => {
    const store = createCourseFiltersStore();
    store.getState().setSub("s1");
    store.getState().setGroup("choice");
    expect(store.getState().filters.group).toBe("choice");
    expect(store.getState().filters.sub).toBe("all");
  });

  it("setSub and setSearch update in place", () => {
    const store = createCourseFiltersStore();
    store.getState().setSub("s1");
    store.getState().setSearch("algebra");
    expect(store.getState().filters.sub).toBe("s1");
    expect(store.getState().filters.search).toBe("algebra");
  });

  it("reset restores EMPTY_FILTERS", () => {
    const store = createCourseFiltersStore();
    store.getState().toggleType("core");
    store.getState().setSearch("x");
    store.getState().reset();
    expect(store.getState().filters).toEqual(EMPTY_FILTERS);
  });
});

describe("createCourseFiltersStore (persisted)", () => {
  const KEY = "test-course-filters";

  it("backfills missing keys from EMPTY_FILTERS and clears search on rehydrate", () => {
    // Older/partial persisted shape: no `types`, a non-empty search.
    localStorage.setItem(
      KEY,
      JSON.stringify({
        state: {
          filters: {
            semesters: ["1"],
            group: "core",
            sub: "all",
            search: "stale",
          },
        },
        version: 0,
      }),
    );

    const store = createCourseFiltersStore({ persistKey: KEY });

    expect(store.getState().filters).toEqual({
      types: [],
      semesters: ["1"],
      group: "core",
      sub: "all",
      search: "",
    });
  });

  it("persists chip selections but never the search text", () => {
    const store = createCourseFiltersStore({ persistKey: KEY });
    store.getState().toggleType("core");
    store.getState().setSearch("algebra");

    const persisted = JSON.parse(localStorage.getItem(KEY) as string);
    expect(persisted.state.filters.types).toEqual(["core"]);
    expect(persisted.state.filters.search).toBe("");
  });
});
