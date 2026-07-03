import { describe, expect, it } from "vitest";

import type { Course } from "@/entities/course";
import {
  EMPTY_FILTERS,
  type CategoryFilterOption,
  type CourseFilterState,
} from "@/features/course-filters";

import type { CatalogCategory } from "../category";
import { filterCatalog } from "../filter";

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

const coreOption: CategoryFilterOption = {
  id: "core",
  label: "Core",
  type: "core",
};
const electiveOption: CategoryFilterOption = {
  id: "elective:ai",
  label: "AI",
  type: "elective",
  category: "ai",
};

const categories: CatalogCategory[] = [
  {
    option: coreOption,
    courses: [
      course({
        id: "a",
        title: "Algorithms",
        description: "study of algorithms",
        recommendedSemester: 1,
      }),
      course({
        id: "b",
        title: "Databases",
        description: "relational databases",
        recommendedSemester: 2,
      }),
    ],
  },
  {
    option: electiveOption,
    courses: [
      course({
        id: "c",
        title: "Design Basics",
        description: "intro to design",
        recommendedSemester: 1,
      }),
    ],
  },
];

const filters = (over: Partial<CourseFilterState> = {}): CourseFilterState => ({
  ...EMPTY_FILTERS,
  ...over,
});

describe("filterCatalog", () => {
  it("returns every section and course with empty filters", () => {
    const result = filterCatalog(categories, filters());
    expect(result).toHaveLength(2);
    expect(result[0].courses).toHaveLength(2);
  });

  it("keeps only the sections matching the group filter", () => {
    const result = filterCatalog(categories, filters({ group: "core" }));
    expect(result).toHaveLength(1);
    expect(result[0].option.id).toBe("core");
  });

  it("narrows courses by search and drops emptied sections", () => {
    const result = filterCatalog(categories, filters({ search: "algo" }));
    // only the core section has a matching course; elective section drops out
    expect(result).toHaveLength(1);
    expect(result[0].courses.map((c) => c.id)).toEqual(["a"]);
  });

  it("matches search against the description too", () => {
    const result = filterCatalog(categories, filters({ search: "study of" }));
    expect(result[0].courses.map((c) => c.id)).toEqual(["a"]);
  });

  it("filters by recommended semester", () => {
    const result = filterCatalog(categories, filters({ semesters: ["2"] }));
    expect(result).toHaveLength(1);
    expect(result[0].courses.map((c) => c.id)).toEqual(["b"]);
  });
});
