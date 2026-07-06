import { describe, expect, it } from "vitest";

import type { CourseDto } from "../../api";
import { normalizeCourse, normalizePrerequisite } from "../normalizeCourse";

const baseDto = (over: Partial<CourseDto> = {}): CourseDto => ({
  id: "c1",
  title: "Intro",
  by_major_type: "core",
  category: "ai",
  available_semesters: [1, 2],
  workload: 5,
  lectures_week: 2,
  seminars_week: 1,
  ...over,
});

describe("normalizeCourse", () => {
  it("maps snake_case dto fields onto the camelCase domain model", () => {
    const result = normalizeCourse(
      baseDto({
        id: "c1",
        title: "Intro",
        description: "desc",
        recommended_semester: 3,
      }),
    );
    expect(result).toMatchObject({
      id: "c1",
      title: "Intro",
      description: "desc",
      type: "core",
      category: "ai",
      recommendedSemester: 3,
      lecturesWeek: 2,
      seminarsWeek: 1,
    });
  });

  it("trims the title and description", () => {
    const result = normalizeCourse(
      baseDto({ title: "  Spaced  ", description: "  hi  " }),
    );
    expect(result.title).toBe("Spaced");
    expect(result.description).toBe("hi");
  });

  it("defaults a missing description to null", () => {
    expect(
      normalizeCourse(baseDto({ description: undefined })).description,
    ).toBe(null);
  });

  it("defaults a missing fixed_semester to 0", () => {
    expect(
      normalizeCourse(baseDto({ fixed_semester: undefined })).fixedSemester,
    ).toBe(0);
  });

  describe("handbook link sanitization", () => {
    it("keeps a valid absolute URL", () => {
      expect(
        normalizeCourse(baseDto({ handbook_link: "https://x.test/page" }))
          .handbookLink,
      ).toBe("https://x.test/page");
    });

    it("drops an invalid URL to an empty string", () => {
      expect(
        normalizeCourse(baseDto({ handbook_link: "not a url" })).handbookLink,
      ).toBe("");
    });

    it("maps null/undefined to an empty string", () => {
      expect(
        normalizeCourse(baseDto({ handbook_link: null })).handbookLink,
      ).toBe("");
      expect(
        normalizeCourse(baseDto({ handbook_link: undefined })).handbookLink,
      ).toBe("");
    });
  });

  it("passes through specializations and mandatory specializations", () => {
    const result = normalizeCourse(
      baseDto({
        specializations: ["s1", "s2"],
        mandatory_specializations: ["s1"],
      }),
    );
    expect(result.specializations).toEqual(["s1", "s2"]);
    expect(result.mandatorySpecializations).toEqual(["s1"]);
  });

  it("sorts prerequisite groups by ascending course count", () => {
    const result = normalizeCourse(
      baseDto({
        prerequisites: [
          { group_id: "g-big", course_ids: ["a", "b", "c"] },
          { group_id: "g-small", course_ids: ["x"] },
        ],
      }),
    );
    expect(result.prerequisites?.map((p) => p.groupId)).toEqual([
      "g-small",
      "g-big",
    ]);
  });
});

describe("normalizePrerequisite", () => {
  it("maps course_ids/group_id to courses/groupId", () => {
    expect(
      normalizePrerequisite({ course_ids: ["a", "b"], group_id: "g1" }),
    ).toEqual({ courses: ["a", "b"], groupId: "g1" });
  });
});
