import { describe, expect, it } from "vitest";

import type { Course } from "@/entities/course";

import { getCourseHints } from "../getCourseHints";

const makeCourse = (id: string, title: string): Course => ({
  id,
  title,
  description: null,
  type: "core",
  category: "swe",
  handbookLink: "",
  availableSemesters: [1],
  recommendedSemester: null,
  workload: 3,
});

const courses: Course[] = [
  makeCourse("a", "Linear Algebra"),
  makeCourse("b", "Algorithms"),
  makeCourse("c", "Databases"),
  makeCourse("d", "algebraic Geometry"),
];

describe("getCourseHints", () => {
  it("matches titles case-insensitively by substring", () => {
    const hints = getCourseHints(courses, "algebra");
    expect(hints.map((c) => c.id)).toEqual(["a", "d"]);
  });

  it("returns [] for an empty or whitespace query", () => {
    expect(getCourseHints(courses, "")).toEqual([]);
    expect(getCourseHints(courses, "   ")).toEqual([]);
  });

  it("returns [] for undefined courses", () => {
    expect(getCourseHints(undefined, "algebra")).toEqual([]);
  });

  it("caps results at 5", () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      makeCourse(`x${i}`, `Match ${i}`),
    );
    expect(getCourseHints(many, "match")).toHaveLength(5);
  });
});
