import { useState } from "react";

export interface ManualSemester {
  semester: number;
  course_ids: string[];
}

const INITIAL_SEMESTERS: ManualSemester[] = [
  { semester: 1, course_ids: [] },
  { semester: 2, course_ids: [] },
  { semester: 3, course_ids: [] },
  { semester: 4, course_ids: [] },
];

export function useManualRoadmapState() {
  const [roadmap, setRoadmap] = useState<ManualSemester[]>(INITIAL_SEMESTERS);

  const addCourse = (semIdx: number, courseId: string) => {
    if (!courseId) return;
    setRoadmap((prev) => {
      if (prev[semIdx].course_ids.includes(courseId)) return prev;
      const next = [...prev];
      next[semIdx] = {
        ...next[semIdx],
        course_ids: [...next[semIdx].course_ids, courseId],
      };
      return next;
    });
  };

  const removeCourse = (semIdx: number, courseId: string) => {
    setRoadmap((prev) => {
      const next = [...prev];
      next[semIdx] = {
        ...next[semIdx],
        course_ids: next[semIdx].course_ids.filter((id) => id !== courseId),
      };
      return next;
    });
  };

  return { roadmap, addCourse, removeCourse };
}
