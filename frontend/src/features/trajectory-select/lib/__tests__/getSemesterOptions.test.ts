import { describe, expect, it } from "vitest";

import type { Course } from "@/entities/course";
import type { SemesterNumber } from "@/shared/constants";

import { getSemesterOptions } from "../getSemesterOptions";

const makeCourse = (overrides: Partial<Course>): Course => ({
  id: "c1",
  title: "Course",
  description: null,
  type: "core",
  category: "swe",
  handbookLink: "",
  availableSemesters: [],
  recommendedSemester: null,
  workload: 3,
  ...overrides,
});

const courses: Course[] = [
  makeCourse({ id: "a", availableSemesters: [1, 3, 5] as SemesterNumber[] }),
  makeCourse({ id: "b", availableSemesters: [2, 4] as SemesterNumber[] }),
];

describe("getSemesterOptions", () => {
  it("returns [] for an unknown course id", () => {
    expect(getSemesterOptions(courses, "missing", 1)).toEqual([]);
  });

  it("returns [] for undefined courses", () => {
    expect(getSemesterOptions(undefined, "a", 1)).toEqual([]);
  });

  it("returns the course's available semesters at/after minSemester", () => {
    expect(getSemesterOptions(courses, "a", 3)).toEqual([3, 5]);
  });

  it("includes the semester equal to minSemester", () => {
    expect(getSemesterOptions(courses, "a", 1)).toEqual([1, 3, 5]);
  });

  it("returns [] when no available semester meets minSemester", () => {
    expect(getSemesterOptions(courses, "b", 5)).toEqual([]);
  });
});
