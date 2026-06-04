import { describe, expect, it } from "vitest";

import type { Course } from "@/entities/course";

import { buildCatalogCategories } from "../buildCatalogCategories";

const makeCourse = (
  id: string,
  category: Course["category"],
  title: string,
): Course => ({
  id,
  title,
  description: null,
  type: "mandatory",
  category,
  handbookLink: "",
  availableSemesters: [1],
  allowedCohorts: [2026],
  recommendedSemester: null,
  workload: 3,
  prerequisites: [],
  corequisites: [],
  postrequisites: [],
  toMajor: {},
});

describe("buildCatalogCategories", () => {
  it("groups courses by category in defined order", () => {
    const courses = [
      makeCourse("1", "ai", "ML"),
      makeCourse("2", "stem", "Math"),
      makeCourse("3", "fundamentals", "CS Basics"),
    ];

    const result = buildCatalogCategories(courses);

    expect(result[0].id).toBe("fundamentals");
    expect(result[0].courses).toHaveLength(1);
    expect(result[1].id).toBe("ai");
    expect(result[1].courses).toHaveLength(1);
    expect(result[5].id).toBe("stem");
    expect(result[5].courses).toHaveLength(1);
  });

  it("sorts courses alphabetically within category", () => {
    const courses = [
      makeCourse("1", "tech", "Zebra"),
      makeCourse("2", "tech", "Alpha"),
      makeCourse("3", "tech", "Beta"),
    ];

    const result = buildCatalogCategories(courses);

    const tech = result.find((c) => c.id === "tech")!;
    expect(tech.courses.map((c) => c.title)).toEqual([
      "Alpha",
      "Beta",
      "Zebra",
    ]);
  });

  it("returns empty arrays for categories with no courses", () => {
    const result = buildCatalogCategories([]);

    expect(result).toHaveLength(7);
    for (const cat of result) {
      expect(cat.courses).toEqual([]);
    }
  });
});
