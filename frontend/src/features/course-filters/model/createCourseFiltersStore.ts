import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  EMPTY_FILTERS,
  type CourseFilterState,
  type FilterGroup,
} from "./options";

const toggle = (list: string[], value: string) =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];

interface CourseFiltersStore {
  filters: CourseFilterState;
  toggleAvailableSemester: (semester: string) => void;
  toggleSemester: (semester: string) => void;
  toggleWorkload: (workload: string) => void;
  clearAvailableSemesters: () => void;
  clearSemesters: () => void;
  clearWorkload: () => void;
  setGroup: (group: FilterGroup) => void;
  setSub: (sub: string) => void;
  setSearch: (search: string) => void;
  reset: () => void;
}

interface CreateCourseFiltersStoreOptions {
  persistKey?: string;
}

export const createCourseFiltersStore = ({
  persistKey,
}: CreateCourseFiltersStoreOptions = {}) => {
  const initializer = (
    set: (
      partial:
        | Partial<CourseFiltersStore>
        | ((state: CourseFiltersStore) => Partial<CourseFiltersStore>),
    ) => void,
  ): CourseFiltersStore => ({
    filters: EMPTY_FILTERS,
    toggleAvailableSemester: (semester) =>
      set((state) => ({
        filters: {
          ...state.filters,
          availableSemesters: toggle(
            state.filters.availableSemesters,
            semester,
          ),
        },
      })),
    toggleSemester: (semester) =>
      set((state) => ({
        filters: {
          ...state.filters,
          semesters: toggle(state.filters.semesters, semester),
        },
      })),
    toggleWorkload: (workload) =>
      set((state) => ({
        filters: {
          ...state.filters,
          workload: toggle(state.filters.workload, workload),
        },
      })),
    clearAvailableSemesters: () =>
      set((state) => ({
        filters: { ...state.filters, availableSemesters: [] },
      })),
    clearSemesters: () =>
      set((state) => ({ filters: { ...state.filters, semesters: [] } })),
    clearWorkload: () =>
      set((state) => ({ filters: { ...state.filters, workload: [] } })),
    setGroup: (group) =>
      set((state) => ({
        // Switching the top-level group resets the sub-selection to "all".
        filters: { ...state.filters, group, sub: "all" },
      })),
    setSub: (sub) => set((state) => ({ filters: { ...state.filters, sub } })),
    setSearch: (search) =>
      set((state) => ({ filters: { ...state.filters, search } })),
    reset: () => set({ filters: EMPTY_FILTERS }),
  });

  if (!persistKey) {
    return create<CourseFiltersStore>()(initializer);
  }

  return create<CourseFiltersStore>()(
    persist(initializer, {
      name: persistKey,
      storage: createJSONStorage(() => localStorage),
      // Persist chip selections only; search always rehydrates empty.
      partialize: (state) => ({
        filters: {
          availableSemesters: state.filters.availableSemesters,
          semesters: state.filters.semesters,
          workload: state.filters.workload,
          group: state.filters.group,
          sub: state.filters.sub,
          search: "",
        },
      }),
      // Backfill any missing keys from EMPTY_FILTERS so older persisted shapes
      // (e.g. pre-`types` state) can't leave a filter dimension undefined.
      merge: (persisted, current) => {
        const persistedFilters =
          (persisted as { filters?: Partial<CourseFilterState> } | undefined)
            ?.filters ?? {};
        return {
          ...current,
          filters: { ...EMPTY_FILTERS, ...persistedFilters, search: "" },
        };
      },
    }),
  );
};
