import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const TOTAL_SEMESTERS = 8;

export interface PlannedCourse {
  id: string;
  title: string;
}

interface PlannerState {
  selections: Record<number, PlannedCourse[]>;
  addCourse: (semester: number, course: PlannedCourse) => void;
  removeCourse: (semester: number, courseId: string) => void;
  moveCourse: (from: number, to: number, courseId: string) => void;
  reset: () => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      selections: {},
      addCourse: (semester, course) =>
        set((state) => {
          const current = state.selections[semester] ?? [];
          if (current.some((c) => c.id === course.id)) return state;
          return {
            selections: {
              ...state.selections,
              [semester]: [...current, course],
            },
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
      moveCourse: (from, to, courseId) =>
        set((state) => {
          if (from === to) return state;
          const fromList = state.selections[from] ?? [];
          const course = fromList.find((c) => c.id === courseId);
          if (!course) return state;
          const toList = state.selections[to] ?? [];
          return {
            selections: {
              ...state.selections,
              [from]: fromList.filter((c) => c.id !== courseId),
              // dedup: only append if not already in the target semester
              ...(toList.some((c) => c.id === courseId)
                ? {}
                : { [to]: [...toList, course] }),
            },
          };
        }),
      reset: () => {
        set(() => ({
          selections: {}
        }))
      }
    }),
    {
      name: "planner-selections",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selections: state.selections }),
    },
  ),
);
