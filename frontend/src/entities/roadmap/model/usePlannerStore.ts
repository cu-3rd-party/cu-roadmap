import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SemesterValidation } from "./domain";
import { CourseCatalogInfo, PlannedCourse } from "./types";

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
  // number = semester number
  selections: Record<number, PlannedCourse[]>;
  // latest backend validation, each entry keyed by SemesterValidation.semester.
  // not persisted — recomputed on the next validation trigger.
  validation: SemesterValidation[];
  // Course ids just added by the generate algorithm, shown with a blue highlight
  generatedIds: Set<string>;
  // Major chosen by the user during onboarding (greeting modal)
  addCourse: (semester: number, course: PlannedCourse) => void;
  // Full reconcile of every placed course against the catalog: refreshes the
  // denormalized display fields (title/category/type), recomputes `fixed`, pins
  // fixed courses into their semester (relocating/adding as needed), and leaves
  // courses absent from the catalog untouched. Idempotent — returns the same
  // state when nothing changed, so it's safe to call on every catalog load.
  resyncSelections: (catalog: CourseCatalogInfo[]) => void;
  markGenerated: (ids: string[]) => void;
  removeCourse: (semester: number, courseId: string) => void;
  clearSemester: (semester: number) => void;
  moveCourse: (from: number, to: number, courseId: string) => void;
  reorderCourses: (semester: number, activeId: string, overId: string) => void;
  setValidation: (validation: SemesterValidation[]) => void;
  // Clears selections. With `keepBeforeSemester`, selections in semesters before
  // that number (i.e. already-completed ones) are preserved. `keepFixed` (default
  // true) keeps fixed courses — set it false for a full wipe on a year/major
  // switch, where the old context's fixed courses no longer apply.
  reset: (keepBeforeSemester?: number, keepFixed?: boolean) => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      selections: {},
      validation: [],
      generatedIds: new Set<string>(),
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
      resyncSelections: (catalog) =>
        set((state) => {
          const info = new Map(catalog.map((c) => [c.id, c] as const));
          let changed = false;
          const next: Record<number, PlannedCourse[]> = {};

          // Refresh existing entries from the catalog.
          for (const [sem, list] of Object.entries(state.selections)) {
            const s = Number(sem);
            const rebuilt: PlannedCourse[] = [];
            for (const c of list) {
              const ci = info.get(c.id);
              // not in the catalog (e.g. another major) — keep the snapshot as-is
              if (!ci) {
                rebuilt.push(c);
                continue;
              }
              const fixed = ci.fixedSemester >= 1;
              // a fixed course only belongs in its semester; drop it here and let
              // it be re-add to the right one
              if (fixed && ci.fixedSemester !== s) {
                changed = true;
                continue;
              }
              if (
                c.title === ci.title &&
                c.category === ci.category &&
                c.type === ci.type &&
                !!c.fixed === fixed
              ) {
                rebuilt.push(c); // unchanged — keep the original reference
              } else {
                changed = true;
                rebuilt.push({
                  ...c,
                  title: ci.title,
                  category: ci.category,
                  type: ci.type,
                  fixed,
                });
              }
            }
            if (rebuilt.length !== list.length) changed = true;
            if (rebuilt.length > 0) next[s] = rebuilt;
          }

          // Ensure every fixed course is present in its semester.
          for (const ci of catalog) {
            if (ci.fixedSemester < 1) continue;
            const list = (next[ci.fixedSemester] ??= []);
            if (!list.some((c) => c.id === ci.id)) {
              changed = true;
              list.push({
                id: ci.id,
                title: ci.title,
                category: ci.category,
                type: ci.type,
                fixed: true,
              });
            }
          }

          return changed ? { selections: next } : state;
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
          const list = state.selections[semester] ?? [];
          // fixed courses survive a semester reset
          const kept = list.filter((c) => c.fixed);
          const cleared = list.filter((c) => !c.fixed).map((c) => c.id);
          const next = { ...state.selections };
          if (kept.length > 0) next[semester] = kept;
          else delete next[semester];
          return {
            selections: next,
            generatedIds: omit(state.generatedIds, cleared),
          };
        }),
      removeCourse: (semester, courseId) =>
        set((state) => {
          const list = state.selections[semester] ?? [];
          // fixed courses can't be removed
          if (list.some((c) => c.id === courseId && c.fixed)) return state;
          return {
            selections: {
              ...state.selections,
              [semester]: list.filter((c) => c.id !== courseId),
            },
            generatedIds: omit(state.generatedIds, [courseId]),
          };
        }),
      moveCourse: (from, to, courseId) =>
        set((state) => {
          if (from === to) return state;
          const fromList = state.selections[from] ?? [];
          const course = fromList.find((c) => c.id === courseId);
          if (!course) return state;
          // fixed courses can't be moved between semesters
          if (course.fixed) return state;
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
          // a conflict on a generated card drops its highlight
          const conflicted: string[] = [];
          for (const sem of validation) {
            for (const msg of sem.messages) {
              if (msg.courseId) conflicted.push(msg.courseId);
            }
          }
          // generated ids are only for blue border, so in case of conflicts drop it
          return {
            validation,
            generatedIds: omit(state.generatedIds, conflicted),
          };
        }),
      reset: (keepBeforeSemester, keepFixed = true) => {
        set((state) => {
          const kept: Record<number, PlannedCourse[]> = {};
          for (const [semester, list] of Object.entries(state.selections)) {
            const s = Number(semester);
            // a completed semester (below the cutoff) is kept entirely; otherwise
            // only fixed courses survive — and only when keepFixed is set (a
            // year/major switch passes false for a full wipe).
            const keepWhole =
              keepBeforeSemester != null && s < keepBeforeSemester;
            const survivors = keepWhole
              ? list
              : keepFixed
                ? list.filter((c) => c.fixed)
                : [];
            if (survivors.length > 0) kept[s] = survivors;
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
      }),
    },
  ),
);
