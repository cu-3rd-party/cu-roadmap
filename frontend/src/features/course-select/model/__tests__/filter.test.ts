import { describe, expect, it } from "vitest";

import type { Course } from "@/entities/course";
import {
  EMPTY_FILTERS,
  type CategoryFilterOption,
  type CourseFilterState,
} from "@/features/course-filters";

import { filterAvailableCourses } from "../filter";

const course = (over: Partial<Course> = {}): Course => ({
  id: "c1",
  title: "Algorithms",
  description: "study of algorithms",
  type: "core",
  category: "ai",
  handbookLink: "",
  availableSemesters: [1],
  workload: 5,
  ...over,
});

const options: CategoryFilterOption[] = [
  { id: "core", label: "Core", type: "core" },
  { id: "elective:ai", label: "AI", type: "elective", category: "ai" },
];

const courses: Course[] = [
  course({ id: "a", title: "Algorithms", type: "core" }),
  course({ id: "b", title: "Design Basics", type: "elective", category: "ai" }),
  // matches no option (type "other" not in `options`) → always filtered out
  course({ id: "c", title: "Orphan", type: "other" }),
];

const filters = (over: Partial<CourseFilterState> = {}): CourseFilterState => ({
  ...EMPTY_FILTERS,
  ...over,
});

describe("filterAvailableCourses", () => {
  it("keeps only courses matching a visible option", () => {
    const result = filterAvailableCourses(courses, filters(), options);
    expect(result.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("narrows to the selected group", () => {
    const result = filterAvailableCourses(
      courses,
      filters({ group: "core" }),
      options,
    );
    expect(result.map((c) => c.id)).toEqual(["a"]);
  });

  it("applies the search query on top of the option filter", () => {
    const result = filterAvailableCourses(
      courses,
      filters({ search: "design" }),
      options,
    );
    expect(result.map((c) => c.id)).toEqual(["b"]);
  });
});
