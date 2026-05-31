import { create } from "zustand";

export interface PlannedCourse {
  id: string;
  title: string;
}

interface PlannerState {
  /** Selected courses keyed by semester index. */
  selections: Record<number, PlannedCourse[]>;
  addCourse: (semester: number, course: PlannedCourse) => void;
  removeCourse: (semester: number, courseId: string) => void;
}

export const usePlannerStore = create<PlannerState>()((set) => ({
  selections: {},
  addCourse: (semester, course) =>
    set((state) => {
      const current = state.selections[semester] ?? [];
      if (current.some((c) => c.id === course.id)) return state;
      return {
        selections: { ...state.selections, [semester]: [...current, course] },
      };
    }),
  removeCourse: (semester, courseId) =>
    set((state) => ({
      selections: {
        ...state.selections,
        [semester]: (state.selections[semester] ?? []).filter(
          (c) => c.id !== courseId,
        ),
      },
    })),
}));
