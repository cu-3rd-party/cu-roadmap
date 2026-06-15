import { admissionYearToSemester } from "@/shared/constants";
import type { AdmissionYear, SemesterNumber } from "@/shared/constants";
import type { UUID } from "@/shared/model";

import type { GoalPathRequestDto } from "../api";
import type { PlannedCourse } from "../model";

import { isSemesterCompleted } from "./isSemesterCompleted";

// Build a goal-path request: reach `targetCourseId` (optionally by `goalSemester`)
// given the courses already completed. passed_course_ids holds only courses in
// completed semesters.
export const buildGoalPathRequest = (
  selections: Record<number, PlannedCourse[]>,
  admissionYear: AdmissionYear,
  targetCourseId: UUID,
  goalSemester?: SemesterNumber,
): GoalPathRequestDto => {
  const passed_course_ids: UUID[] = [];

  const semesters = Object.keys(selections)
    .map(Number)
    .sort((a, b) => a - b);

  for (const semester of semesters) {
    const courses = selections[semester] ?? [];
    if (courses.length === 0) continue;

    if (isSemesterCompleted(semester, admissionYear)) {
      passed_course_ids.push(...courses.map((c) => c.id));
    }
  }
  // TODO
  return {
    target_course_id: targetCourseId,
    passed_course_ids,
    current_semester: admissionYearToSemester[admissionYear],
    goal_semester: goalSemester,
    max_load: 30,
  };
};

