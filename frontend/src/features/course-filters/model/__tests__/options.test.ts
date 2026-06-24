import { describe, expect, it } from "vitest";

import type { Course } from "@/entities/course";
import type { Specialization } from "@/entities/specialization";

import { buildCategoryFilters, courseMatchesOption } from "../options";

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
        id: "other:fundamentals",
        label: "Fundamentals",
        type: "other",
        category: "fundamentals",
      },
      { id: "other:stem", label: "STEM", type: "other", category: "stem" },
      { id: "other:soft", label: "Soft", type: "other", category: "soft" },
      {
        id: "elective:business",
        label: "Business",
        type: "elective",
        category: "business",
      },
      { id: "elective:ai", label: "AI", type: "elective", category: "ai" },
    ]);
  });

  it("labels the remaining-major electives by major name, not the elective slug", () => {
    const labels = buildCategoryFilters("ai", [])
      .filter((option) => option.type === "elective")
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
        .filter((option) => option.type === "elective")
        .map((option) => option.id),
    ).toEqual(["elective:business", "elective:swe", "elective:ai"]);
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
