import {
  admissionYearToSemester,
  type AdmissionYear,
} from "@/shared/constants";

import type { ValidateRoadmapRequestDto } from "../api";
import type { PlannedCourse } from "../model";

// Partition the saved selections into the validate-roadmap payload:
// courses in completed semesters collapse into a single passed_course_ids
// array, while the remaining semesters are sent segmented under roadmap.
export const buildValidateRoadmapRequest = (
  selections: Record<number, PlannedCourse[]>,
  admissionYear: AdmissionYear,
  majorId?: string | null,
  specializationId?: string | null,
): ValidateRoadmapRequestDto => {
  const roadmap: ValidateRoadmapRequestDto["roadmap"] = [];

  const semesters = Object.keys(selections)
    .map(Number)
    .sort((a, b) => a - b);

  for (const semester of semesters) {
    const courses = selections[semester] ?? [];
    if (courses.length === 0) continue;
    roadmap.push({ semester, course_ids: courses.map((c) => c.id) });
  }

  // TODO
  const max_load = 999;

  return {
    major_id: majorId ?? undefined,
    specialization_id: specializationId ?? undefined,
    roadmap,
    max_load,
    current_semester: admissionYearToSemester[admissionYear],
  };
};
