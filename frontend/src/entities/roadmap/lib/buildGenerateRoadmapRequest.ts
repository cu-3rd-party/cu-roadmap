import { admissionYearToSemester } from "@/shared/constants";
import type { AdmissionYear } from "@/shared/constants";
import type { UUID } from "@/shared/model";

import type { GenerateRoadmapRequestDto } from "../api";
import type { PlannedCourse } from "../model";

import { isSemesterCompleted } from "./isSemesterCompleted";

// Collect the passed_course_ids for a generate request. `scope` decides which of
// the saved selections count as "passed".
export const buildGenerateRoadmapRequest = (
  selections: Record<number, PlannedCourse[]>,
  admissionYear: AdmissionYear,
  majorId: UUID,
  scope: "completed" | "all",
): GenerateRoadmapRequestDto => {
  const passed_course_ids: UUID[] = [];
  const selected_course_ids: { semester: number; course_ids: UUID[] }[] = [];

  const semesters = Object.keys(selections)
    .map(Number)
    .sort((a, b) => a - b);

  for (const semester of semesters) {
    const courses = selections[semester] ?? [];
    if (courses.length === 0) continue;

    if (isSemesterCompleted(semester, admissionYear)) {
      passed_course_ids.push(...courses.map((c) => c.id));
    } else if (scope === "all") {
      selected_course_ids.push({
        semester,
        course_ids: courses.map((c) => c.id),
      });
    }
  }

  return {
    passed_course_ids,
    ...(scope === "all"
      ? { selected_course_ids, course_source: "selected" }
      : { course_source: "passed" }),
    major_id: majorId,
    cohort: admissionYear,
    current_semester: admissionYearToSemester[admissionYear],
    max_load: 12,
  };
};
