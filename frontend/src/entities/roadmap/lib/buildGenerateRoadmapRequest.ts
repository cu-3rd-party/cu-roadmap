import { admissionYearToSemester } from "@/shared/constants";
import type { AdmissionYear } from "@/shared/constants";
import type { UUID } from "@/shared/model";

import type { CourseSource, GenerateRoadmapRequestDto } from "../api";
import type { PlannedCourse } from "../model";

import { isSemesterCompleted } from "./isSemesterCompleted";

export const buildGenerateRoadmapRequest = (
  selections: Record<number, PlannedCourse[]>,
  admissionYear: AdmissionYear,
  majorId: UUID,
  scope: CourseSource,
): GenerateRoadmapRequestDto => {
  const passed_course_ids: UUID[] = [];
  const selected_course_ids: GenerateRoadmapRequestDto["selected_course_ids"] =
    [];

  const semesters = Object.keys(selections)
    .map(Number)
    .sort((a, b) => a - b);

  for (const semester of semesters) {
    const courses = selections[semester] ?? [];
    if (courses.length === 0) continue;

    if (isSemesterCompleted(semester, admissionYear)) {
      passed_course_ids.push(...courses.map((c) => c.id));
    } else {
      selected_course_ids.push({
        semester,
        course_ids: courses.map((c) => c.id),
      });
    }
  }

  return {
    passed_course_ids,
    selected_course_ids,
    course_source: scope,
    major_id: majorId,
    cohort: admissionYear,
    current_semester: admissionYearToSemester[admissionYear],
    max_load: 30,
  };
};

