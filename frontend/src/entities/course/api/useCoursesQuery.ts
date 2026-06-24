import { useQuery } from "@tanstack/react-query";

import type { AdmissionYear } from "@/shared/constants";
import { sortKey } from "@/shared/lib";
import type { UUID } from "@/shared/model";

import { normalizeCourse } from "../lib";

import { getCourses } from "./getCourses";

export const coursesQueryKey = (year: AdmissionYear, majorId: UUID) =>
  ["courses", year, majorId] as const;

// majorId is part of the request path: courses/{admissionYear}/{majorId}
export const useCoursesQuery = (
  year: AdmissionYear | null,
  majorId: UUID | null = null,
) =>
  useQuery({
    queryKey: ["courses", year, majorId],
    queryFn: () =>
      getCourses(year!, majorId!).then((dtos) =>
        dtos
          .map(normalizeCourse)
          .sort((a, b) => sortKey(a.title).localeCompare(sortKey(b.title))),
      ),
    enabled: year != null && majorId != null,
  });
