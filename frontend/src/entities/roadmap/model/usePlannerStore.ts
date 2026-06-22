import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { UUID } from "@/shared/model";

import type { SemesterValidation } from "./domain";
import { PlannedCourse } from "./types";

// Returns a new set with `ids` removed, or the same reference when nothing
const omit = (source: Set<string>, ids: Iterable<string>): Set<string> => {
  let next: Set<string> | null = null;
  for (const id of ids) {
    if (!source.has(id)) continue;
    next ??= new Set(source);
    next.delete(id);
  }
  return next ?? source;
};

interface PlannerState {
  selections: Record<number, PlannedCourse[]>;
  // latest backend validation, each entry keyed by SemesterValidation.semester.
  // not persisted — recomputed on the next validation trigger.
  validation: SemesterValidation[];
  // Course ids just added by the generate algorithm, shown with a blue highlight
  generatedIds: Set<string>;
  // Major chosen by the user during onboarding (greeting modal)
  majorId: UUID | null;
  setMajorId: (majorId: UUID | null) => void;
  addCourse: (semester: number, course: PlannedCourse) => void;
  markGenerated: (ids: string[]) => void;
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
      generatedIds: new Set<string>(),
      majorId: null,
      setMajorId: (majorId) => set({ majorId }),
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
      markGenerated: (ids) =>
        set((state) => {
          if (ids.length === 0) return state;
          const next = new Set(state.generatedIds);
          for (const id of ids) next.add(id);
          return { generatedIds: next };
        }),
      clearSemester: (semester) =>
        set((state) => {
          const next = { ...state.selections };
          const cleared = (next[semester] ?? []).map((c) => c.id);
          delete next[semester];
          return {
            selections: next,
            generatedIds: omit(state.generatedIds, cleared),
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
          generatedIds: omit(state.generatedIds, [courseId]),
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
            // a move across semesters clears the generated highlight
            generatedIds: omit(state.generatedIds, [courseId]),
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
            // reordering within a semester clears the dragged card's highlight
            generatedIds: omit(state.generatedIds, [activeId]),
          };
        }),
      setValidation: (validation) =>
        set((state) => {
          // a conflict on a generated card drops its highlight (red wins)
          const conflicted: string[] = [];
          for (const sem of validation) {
            for (const msg of sem.messages) {
              if (msg.courseId) conflicted.push(msg.courseId);
            }
          }
          return {
            validation,
            generatedIds: omit(state.generatedIds, conflicted),
          };
        }),
      reset: (keepBeforeSemester) => {
        set((state) => {
          if (keepBeforeSemester == null)
            return {
              selections: {},
              validation: [],
              generatedIds: new Set<string>(),
              majorId: null,
            };
          const kept: Record<number, PlannedCourse[]> = {};
          for (const [semester, list] of Object.entries(state.selections)) {
            if (Number(semester) < keepBeforeSemester) {
              kept[Number(semester)] = list;
            }
          }
          return {
            selections: kept,
            validation: [],
            generatedIds: new Set<string>(),
          };
        });
      },
    }),
    {
      name: "planner-selections",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selections: state.selections,
        majorId: state.majorId,
      }),
    },
  ),
);
