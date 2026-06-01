import { useCallback, useState } from "react";

import { EMPTY_FILTERS, type CourseFilterState } from "./options";

const toggle = (list: string[], value: string) =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];

export const useCourseFilters = (
  initial: CourseFilterState = EMPTY_FILTERS,
) => {
  const [filters, setFilters] = useState<CourseFilterState>(initial);

  const toggleYear = useCallback(
    (year: string) =>
      setFilters((prev) => ({ ...prev, years: toggle(prev.years, year) })),
    [],
  );

  const toggleMajor = useCallback(
    (major: string) =>
      setFilters((prev) => ({ ...prev, majors: toggle(prev.majors, major) })),
    [],
  );

  const toggleCategory = useCallback(
    (id: string) =>
      setFilters((prev) => ({
        ...prev,
        categories: toggle(prev.categories, id),
      })),
    [],
  );

  const setSearch = useCallback(
    (search: string) => setFilters((prev) => ({ ...prev, search })),
    [],
  );

  const reset = useCallback(() => setFilters(EMPTY_FILTERS), []);

  return {
    filters,
    toggleYear,
    toggleMajor,
    toggleCategory,
    setSearch,
    reset,
  };
};
