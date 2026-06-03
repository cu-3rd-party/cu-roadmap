import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SemesterValidation } from "./domain";
import { PlannedCourse } from "./types";

interface PlannerState {
  selections: Record<number, PlannedCourse[]>;
  // latest backend validation, each entry keyed by SemesterValidation.semester.
  // not persisted — recomputed on the next validation trigger.
  validation: SemesterValidation[];
  addCourse: (semester: number, course: PlannedCourse) => void;
  removeCourse: (semester: number, courseId: string) => void;
  clearSemester: (semester: number) => void;
  moveCourse: (from: number, to: number, courseId: string) => void;
  reorderCourses: (semester: number, activeId: string, overId: string) => void;
  setValidation: (validation: SemesterValidation[]) => void;
  // Clears selections. With `keepBeforeSemester`, selections in semesters before
  // that number (i.e. already-completed ones) are preserved.
  reset: (keepBeforeSemester?: number) => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      selections: {},
      validation: [],
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
      clearSemester: (semester) =>
        set((state) => {
          const next = { ...state.selections };
          delete next[semester];
          return { selections: next };
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
      setValidation: (validation) => set({ validation }),
      reset: (keepBeforeSemester) => {
        set((state) => {
          if (keepBeforeSemester == null)
            return { selections: {}, validation: [] };
          const kept: Record<number, PlannedCourse[]> = {};
          for (const [semester, list] of Object.entries(state.selections)) {
            if (Number(semester) < keepBeforeSemester) {
              kept[Number(semester)] = list;
            }
          }
          return { selections: kept, validation: [] };
        });
      },
    }),
    {
      name: "planner-selections",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selections: state.selections }),
    },
  ),
);
