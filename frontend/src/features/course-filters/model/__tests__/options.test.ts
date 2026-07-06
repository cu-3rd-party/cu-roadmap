import { describe, expect, it } from "vitest";

import type { Course } from "@/entities/course";
import type { Specialization } from "@/entities/specialization";

import {
  buildCategorySections,
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

describe("buildCategorySections", () => {
  it("emits chips in the documented order for a major + specializations", () => {
    const options = buildCategorySections("swe", [
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
        label: "Факультативы",
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
        label: "Fundamentals (Факультативы)",
        type: "elective",
        category: "fundamentals",
      },
      { id: "flex:stem", label: "STEM", type: "flex", category: "stem" },
      { id: "flex:soft", label: "Soft", type: "flex", category: "soft" },
    ]);
  });

  it("labels the remaining-major electives by major name, not the elective slug", () => {
    const labels = buildCategorySections("ai", [])
      .filter((option) => option.id.startsWith("elective:"))
      .map((option) => option.label);

    // First elective (the major itself) uses the elective label; the two
    // remaining majors are labeled by their major name.
    expect(labels).toEqual(["Факультативы", "Business", "SWE"]);
  });

  it("drops the single major elective and lists all majors when none is selected", () => {
    const options = buildCategorySections(null, [spec("s1", "Backend")]);

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
    expect(buildSubOptions("flex", "swe", []).map((o) => o.id)).toEqual([
      "all",
      "stem",
      "soft",
    ]);
  });
});

describe("optionMatchesFilter", () => {
  const options = buildCategorySections("swe", [
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
    expect(ids("flex", "all")).toEqual(["flex:stem", "flex:soft"]);
  });

  it("narrows by the sub-selection", () => {
    expect(ids("choice", "s1")).toEqual(["choice:s1"]);
    expect(ids("elective", "business")).toEqual(["elective:business"]);
    expect(ids("fundamentals", "mandatory")).toEqual([
      "fundamentals:mandatory",
    ]);
    expect(ids("fundamentals", "elective")).toEqual(["fundamentals:elective"]);
    expect(ids("flex", "soft")).toEqual(["flex:soft"]);
  });
});

describe("courseMatchesOption", () => {
  it("matches core by type only", () => {
    const option = buildCategorySections("swe", [])[0];
    expect(courseMatchesOption(makeCourse({ type: "core" }), option)).toBe(
      true,
    );
    expect(courseMatchesOption(makeCourse({ type: "elective" }), option)).toBe(
      false,
    );
  });

  it("matches choice by specialization membership", () => {
    const [option] = buildCategorySections("swe", [
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
    const option = buildCategorySections("swe", []).find(
      (o) => o.id === "flex:stem",
    )!;

    expect(
      courseMatchesOption(
        makeCourse({ type: "flex", category: "stem" }),
        option,
      ),
    ).toBe(true);
    expect(
      courseMatchesOption(
        makeCourse({ type: "flex", category: "soft" }),
        option,
      ),
    ).toBe(false);
  });
});
