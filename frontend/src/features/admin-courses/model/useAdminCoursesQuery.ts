import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getAllCourses, normalizeCourse } from "@/entities/course";
import type { CourseListFilters } from "@/entities/course";
import { sortKey } from "@/shared/lib";

export const adminCoursesQueryKey = (filters: CourseListFilters) =>
  ["admin", "courses", filters] as const;

/* The catalog list for the admin courses screen. Filtering happens server-side
   (the backend turns cohort_year/category/title into SQL), so the filters are
   part of the key. `keepPreviousData` keeps the previous grid on screen while a
   chip toggle refetches, instead of collapsing it back to skeletons. */
export const useAdminCoursesQuery = (filters: CourseListFilters) =>
  useQuery({
    queryKey: adminCoursesQueryKey(filters),
    queryFn: () =>
      getAllCourses(filters).then((dtos) =>
        dtos
          .map(normalizeCourse)
          .sort((a, b) => sortKey(a.title).localeCompare(sortKey(b.title))),
      ),
    placeholderData: keepPreviousData,
  });
