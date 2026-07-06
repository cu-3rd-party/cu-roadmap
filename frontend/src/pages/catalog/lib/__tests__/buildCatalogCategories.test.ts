import { describe, expect, it } from "vitest";

import type { Course } from "@/entities/course";
import type { Specialization } from "@/entities/specialization";
import { buildCategorySections } from "@/features/course-filters";

import { buildCatalogCategories } from "../buildCatalogCategories";

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
  category: "swe",
  handbookLink: "",
  availableSemesters: [1],
  recommendedSemester: null,
  workload: 3,
  ...overrides,
});

const options = buildCategorySections("swe", [
  spec("s1", "Backend"),
  spec("s2", "Frontend"),
]);

describe("buildCatalogCategories", () => {
  it("builds one section per filter chip, in chip order", () => {
    const result = buildCatalogCategories([], options);

    expect(result.map((section) => section.option.id)).toEqual(
      options.map((option) => option.id),
    );
  });

  it("places courses into sections using courseMatchesOption", () => {
    const courses = [
      makeCourse({ id: "core1", type: "core", title: "Core course" }),
      makeCourse({
        id: "ch1",
        type: "choice",
        specializations: ["s1"],
        title: "Backend course",
      }),
      makeCourse({
        id: "el1",
        type: "elective",
        category: "swe",
        title: "SWE elective",
      }),
      makeCourse({
        id: "stem1",
        type: "flex",
        category: "stem",
        title: "Math",
      }),
      makeCourse({
        id: "ai1",
        type: "elective",
        category: "ai",
        title: "AI elective",
      }),
    ];

    const result = buildCatalogCategories(courses, options);
    const byId = (id: string) =>
      result.find((section) => section.option.id === id)!;

    expect(byId("core").courses.map((c) => c.id)).toEqual(["core1"]);
    expect(byId("choice:s1").courses.map((c) => c.id)).toEqual(["ch1"]);
    expect(byId("choice:s2").courses).toHaveLength(0);
    expect(byId("elective:swe").courses.map((c) => c.id)).toEqual(["el1"]);
    expect(byId("flex:stem").courses.map((c) => c.id)).toEqual(["stem1"]);
    expect(byId("elective:ai").courses.map((c) => c.id)).toEqual(["ai1"]);
  });

  it("sorts courses alphabetically within a section", () => {
    const courses = [
      makeCourse({ id: "1", type: "flex", category: "stem", title: "Zebra" }),
      makeCourse({ id: "2", type: "flex", category: "stem", title: "Alpha" }),
      makeCourse({ id: "3", type: "flex", category: "stem", title: "Beta" }),
    ];

    const result = buildCatalogCategories(courses, options);
    const stem = result.find((section) => section.option.id === "flex:stem")!;

    expect(stem.courses.map((c) => c.title)).toEqual([
      "Alpha",
      "Beta",
      "Zebra",
    ]);
  });
});
