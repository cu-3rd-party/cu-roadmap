import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { PlannedCourse } from "./types";


interface PlannerState {
  selections: Record<number, PlannedCourse[]>;
  addCourse: (semester: number, course: PlannedCourse) => void;
  removeCourse: (semester: number, courseId: string) => void;
  moveCourse: (from: number, to: number, courseId: string) => void;
  reorderCourses: (semester: number, activeId: string, overId: string) => void;
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
      reorderCourses: (semester, activeId, overId) =>
        set((state) => {
          if (activeId === overId) return state;
          const list = state.selections[semester] ?? [];
          const oldIndex = list.findIndex((c) => c.id === activeId);
          const newIndex = list.findIndex((c) => c.id === overId);
          if (oldIndex === -1 || newIndex === -1) return state;
          const next = list.slice();
          const [moved] = next.splice(oldIndex, 1);
          next.splice(newIndex, 0, moved);
          return {
            selections: { ...state.selections, [semester]: next },
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
