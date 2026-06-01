import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { EMPTY_FILTERS, type CourseFilterState } from "./options";

const toggle = (list: string[], value: string) =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];

interface CourseFiltersStore {
  filters: CourseFilterState;
  toggleYear: (year: string) => void;
  toggleMajor: (major: string) => void;
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
    toggleYear: (year) =>
      set((state) => ({
        filters: { ...state.filters, years: toggle(state.filters.years, year) },
      })),
    toggleMajor: (major) =>
      set((state) => ({
        filters: {
          ...state.filters,
          majors: toggle(state.filters.majors, major),
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
          years: state.filters.years,
          majors: state.filters.majors,
          categories: state.filters.categories,
          search: "",
        },
      }),
    }),
  );
};
