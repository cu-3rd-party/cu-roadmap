import { describe, expect, it } from "vitest";

import type { Course } from "@/entities/course";
import type { Specialization } from "@/entities/specialization";

import {
  buildCategoryFilters,
  buildSubOptions,
  courseMatchesOption,
  optionMatchesFilter,
} from "../options";

const spec = (id: string, title: string): Specialization => ({
  id,
  majorId: "m1",
  title,
});

const makeCourse = (overrides: Partial<Course>): Course => ({
  id: "c1",
  title: "Course",
  description: null,
  type: "core",
  category: "fundamentals",
  handbookLink: "",
  availableSemesters: [1],
  recommendedSemester: null,
  workload: 3,
  ...overrides,
});

describe("buildCategoryFilters", () => {
  it("emits chips in the documented order for a major + specializations", () => {
    const options = buildCategoryFilters("swe", [
      spec("s1", "Backend"),
      spec("s2", "Frontend"),
    ]);

    expect(
      options.map(({ id, label, type, category }) => ({
        id,
        label,
        type,
        category,
      })),
    ).toEqual([
      { id: "core", label: "Core", type: "core", category: undefined },
      {
        id: "choice:s1",
        label: "Backend",
        type: "choice",
        category: "swe",
      },
      {
        id: "choice:s2",
        label: "Frontend",
        type: "choice",
        category: "swe",
      },
      {
        id: "elective:swe",
        label: "Факультатив",
        type: "elective",
        category: "swe",
      },
      {
        id: "elective:business",
        label: "Business",
        type: "elective",
        category: "business",
      },
      { id: "elective:ai", label: "AI", type: "elective", category: "ai" },
      {
        id: "fundamentals:mandatory",
        label: "Fundamentals",
        type: "other",
        category: "fundamentals",
      },
      {
        id: "fundamentals:elective",
        label: "Fundamentals (Факультатив)",
        type: "elective",
        category: "fundamentals",
      },
      { id: "other:stem", label: "STEM", type: "other", category: "stem" },
      { id: "other:soft", label: "Soft", type: "other", category: "soft" },
    ]);
  });

  it("labels the remaining-major electives by major name, not the elective slug", () => {
    const labels = buildCategoryFilters("ai", [])
      .filter((option) => option.id.startsWith("elective:"))
      .map((option) => option.label);

    // First elective (the major itself) uses the elective label; the two
    // remaining majors are labeled by their major name.
    expect(labels).toEqual(["Факультатив", "Business", "SWE"]);
  });

  it("drops the single major elective and lists all majors when none is selected", () => {
    const options = buildCategoryFilters(null, [spec("s1", "Backend")]);

    // Choice chips still render (with no category) so specializations are listed.
    expect(
      options
        .filter((option) => option.type === "choice")
        .map((option) => ({ id: option.id, category: option.category })),
    ).toEqual([{ id: "choice:s1", category: undefined }]);

    expect(
      options
        .filter((option) => option.id.startsWith("elective:"))
        .map((option) => option.id),
    ).toEqual(["elective:business", "elective:swe", "elective:ai"]);
  });
});

describe("buildSubOptions", () => {
  it("has no sub-options for all/core", () => {
    expect(buildSubOptions("all", "swe", [])).toEqual([]);
    expect(buildSubOptions("core", "swe", [])).toEqual([]);
  });

  it("leads choice with All then the specializations", () => {
    expect(buildSubOptions("choice", "swe", [spec("s1", "Backend")])).toEqual([
      { id: "all", label: "Все" },
      { id: "s1", label: "Backend" },
    ]);
  });

  it("orders elective with the settings major first", () => {
    expect(
      buildSubOptions("elective", "business", []).map((o) => o.id),
    ).toEqual(["all", "business", "swe", "ai"]);
  });

  it("offers mandatory/elective for fundamentals and stem/soft for other", () => {
    expect(buildSubOptions("fundamentals", "swe", []).map((o) => o.id)).toEqual(
      ["all", "mandatory", "elective"],
    );
    expect(buildSubOptions("other", "swe", []).map((o) => o.id)).toEqual([
      "all",
      "stem",
      "soft",
    ]);
  });
});

describe("optionMatchesFilter", () => {
  const options = buildCategoryFilters("swe", [
    spec("s1", "Backend"),
    spec("s2", "Frontend"),
  ]);
  const ids = (group: Parameters<typeof optionMatchesFilter>[1], sub: string) =>
    options
      .filter((option) => optionMatchesFilter(option, group, sub))
      .map((option) => option.id);

  it("shows every card under all", () => {
    expect(ids("all", "all")).toEqual(options.map((o) => o.id));
  });

  it("scopes each group to its own cards", () => {
    expect(ids("core", "all")).toEqual(["core"]);
    expect(ids("choice", "all")).toEqual(["choice:s1", "choice:s2"]);
    expect(ids("elective", "all")).toEqual([
      "elective:swe",
      "elective:business",
      "elective:ai",
    ]);
    expect(ids("fundamentals", "all")).toEqual([
      "fundamentals:mandatory",
      "fundamentals:elective",
    ]);
    expect(ids("other", "all")).toEqual(["other:stem", "other:soft"]);
  });

  it("narrows by the sub-selection", () => {
    expect(ids("choice", "s1")).toEqual(["choice:s1"]);
    expect(ids("elective", "business")).toEqual(["elective:business"]);
    expect(ids("fundamentals", "mandatory")).toEqual([
      "fundamentals:mandatory",
    ]);
    expect(ids("fundamentals", "elective")).toEqual(["fundamentals:elective"]);
    expect(ids("other", "soft")).toEqual(["other:soft"]);
  });
});

describe("courseMatchesOption", () => {
  it("matches core by type only", () => {
    const option = buildCategoryFilters("swe", [])[0];
    expect(courseMatchesOption(makeCourse({ type: "core" }), option)).toBe(
      true,
    );
    expect(courseMatchesOption(makeCourse({ type: "elective" }), option)).toBe(
      false,
    );
  });

  it("matches choice by specialization membership", () => {
    const [option] = buildCategoryFilters("swe", [
      spec("s1", "Backend"),
    ]).filter((o) => o.type === "choice");

    expect(
      courseMatchesOption(
        makeCourse({ type: "choice", specializations: ["s1"] }),
        option,
      ),
    ).toBe(true);
    expect(
      courseMatchesOption(
        makeCourse({ type: "choice", specializations: ["s2"] }),
        option,
      ),
    ).toBe(false);
  });

  it("matches by category when set", () => {
    const option = buildCategoryFilters("swe", []).find(
      (o) => o.id === "other:stem",
    )!;

    expect(
      courseMatchesOption(
        makeCourse({ type: "other", category: "stem" }),
        option,
      ),
    ).toBe(true);
    expect(
      courseMatchesOption(
        makeCourse({ type: "other", category: "soft" }),
        option,
      ),
    ).toBe(false);
  });
});
