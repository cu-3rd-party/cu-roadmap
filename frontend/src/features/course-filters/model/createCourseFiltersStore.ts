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
  toggleType: (type: string) => void;
  toggleSemester: (semester: string) => void;
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
    toggleType: (type) =>
      set((state) => ({
        filters: {
          ...state.filters,
          types: toggle(state.filters.types, type),
        },
      })),
    toggleSemester: (semester) =>
      set((state) => ({
        filters: {
          ...state.filters,
          semesters: toggle(state.filters.semesters, semester),
        },
      })),
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
          types: state.filters.types,
          semesters: state.filters.semesters,
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
