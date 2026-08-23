import { describe, expect, it } from "vitest";

import type { Course, CourseDependency } from "@/entities/course";

import {
  courseToEditorFields,
  editorSnapshotKey,
  type CourseEditorFields,
} from "../editorSnapshot";

const course = (over: Partial<Course> = {}): Course => ({
  id: "c1",
  title: "Линейная алгебра",
  description: "Описание",
  type: "elective",
  category: "swe",
  handbookLink: "",
  allowedCohorts: [2025],
  availableSemesters: [2, 1],
  workload: 3,
  lecturesWeek: 2,
  seminarsWeek: 1,
  ...over,
});

const row = (over: Partial<CourseDependency> = {}): CourseDependency => ({
  id: "r1",
  courseId: "c1",
  requiredCourseId: "p1",
  requiredGroupId: null,
  type: "prerequisite",
  alternativeGroup: 0,
  ...over,
});

const fields = (
  over: Partial<CourseEditorFields> = {},
): CourseEditorFields => ({
  ...courseToEditorFields(course()),
  ...over,
});

describe("courseToEditorFields", () => {
  it("takes год and тип from the course", () => {
    expect(courseToEditorFields(course())).toMatchObject({
      year: "2025",
      courseType: "swe",
    });
  });

  it("falls back to the first option when the course has neither", () => {
    expect(
      courseToEditorFields(
        course({ allowedCohorts: undefined, category: undefined as never }),
      ),
    ).toMatchObject({ year: "2024", courseType: "ai" });
  });

  it("normalizes a null description to an empty string", () => {
    // The control is always a string; null would read as a change on first keystroke.
    expect(
      courseToEditorFields(course({ description: null })).description,
    ).toBe("");
  });

  it("defaults missing week counts to zero", () => {
    expect(
      courseToEditorFields(
        course({ lecturesWeek: undefined, seminarsWeek: undefined }),
      ),
    ).toMatchObject({ lecturesWeek: "0", seminarsWeek: "0" });
  });
});

describe("editorSnapshotKey", () => {
  it("matches for a course compared against its own fields", () => {
    const rows = [row()];
    expect(editorSnapshotKey(courseToEditorFields(course()), rows)).toBe(
      editorSnapshotKey(courseToEditorFields(course()), rows),
    );
  });

  it("changes when a field changes", () => {
    expect(editorSnapshotKey(fields({ title: "Другое" }), [])).not.toBe(
      editorSnapshotKey(fields(), []),
    );
  });

  it("ignores semester ordering", () => {
    expect(editorSnapshotKey(fields({ semesters: ["1", "2"] }), [])).toBe(
      editorSnapshotKey(fields({ semesters: ["2", "1"] }), []),
    );
  });

  it("ignores requisite ordering", () => {
    const a = row({ id: "r1", requiredCourseId: "p1" });
    const b = row({ id: "r2", requiredCourseId: "p2" });

    expect(editorSnapshotKey(fields(), [a, b])).toBe(
      editorSnapshotKey(fields(), [b, a]),
    );
  });

  it("ignores the row id, so a re-added requisite is not a change", () => {
    expect(editorSnapshotKey(fields(), [row({ id: "row-7" })])).toBe(
      editorSnapshotKey(fields(), [row({ id: "local-1" })]),
    );
  });

  it("changes when a requisite is removed", () => {
    expect(editorSnapshotKey(fields(), [])).not.toBe(
      editorSnapshotKey(fields(), [row()]),
    );
  });

  it("distinguishes a course requisite from a box one", () => {
    expect(
      editorSnapshotKey(fields(), [
        row({ requiredCourseId: "x", requiredGroupId: null }),
      ]),
    ).not.toBe(
      editorSnapshotKey(fields(), [
        row({ requiredCourseId: null, requiredGroupId: "x" }),
      ]),
    );
  });

  it("distinguishes a prerequisite from a corequisite", () => {
    expect(
      editorSnapshotKey(fields(), [row({ type: "prerequisite" })]),
    ).not.toBe(editorSnapshotKey(fields(), [row({ type: "corequisite" })]));
  });

  it("notices a changed alternative group", () => {
    expect(
      editorSnapshotKey(fields(), [row({ alternativeGroup: 0 })]),
    ).not.toBe(editorSnapshotKey(fields(), [row({ alternativeGroup: 1 })]));
  });
});
