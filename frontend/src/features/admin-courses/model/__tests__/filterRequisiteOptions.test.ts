import { describe, expect, it } from "vitest";

import type { Course } from "@/entities/course";

import { filterCoursesBySearch } from "../filterRequisiteOptions";

const course = (over: Partial<Course> = {}): Course => ({
  id: "c1",
  title: "Линейная алгебра",
  description: "матрицы и векторы",
  type: "core",
  category: "ai",
  handbookLink: "",
  availableSemesters: [1],
  workload: 4,
  ...over,
});

const courses = [
  course({ id: "a", title: "Линейная алгебра" }),
  course({ id: "b", title: "Дискретная математика", description: "графы" }),
];

describe("filterCoursesBySearch", () => {
  it("returns everything for an empty query", () => {
    expect(filterCoursesBySearch(courses, "").map((c) => c.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("matches the title case-insensitively and ignores surrounding space", () => {
    expect(
      filterCoursesBySearch(courses, "  ДИСКРЕТНАЯ ").map((c) => c.id),
    ).toEqual(["b"]);
  });

  it("matches the description too", () => {
    expect(filterCoursesBySearch(courses, "графы").map((c) => c.id)).toEqual([
      "b",
    ]);
  });

  it("drops the excluded course even when it matches", () => {
    expect(
      filterCoursesBySearch(courses, "линейная", "a").map((c) => c.id),
    ).toEqual([]);
  });

  it("drops the excluded course when there is no query", () => {
    expect(filterCoursesBySearch(courses, "", "a").map((c) => c.id)).toEqual([
      "b",
    ]);
  });

  it("tolerates a course with no description", () => {
    const noDescription = [course({ id: "x", description: undefined })];
    expect(filterCoursesBySearch(noDescription, "матрицы")).toEqual([]);
  });
});
