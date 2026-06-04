import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { EMPTY_FILTERS, type CourseFilterState } from "./options";

const toggle = (list: string[], value: string) =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];

interface CourseFiltersStore {
  filters: CourseFilterState;
  toggleType: (type: string) => void;
  toggleSemester: (semester: string) => void;
  toggleCategory: (id: string) => void;
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
    toggleCategory: (id) =>
      set((state) => ({
        filters: {
          ...state.filters,
          categories: toggle(state.filters.categories, id),
        },
      })),
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
          categories: state.filters.categories,
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
