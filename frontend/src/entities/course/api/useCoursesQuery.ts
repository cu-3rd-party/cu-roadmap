import { useQuery } from "@tanstack/react-query";

import type { AdmissionYear } from "@/shared/constants";

import { normalizeCourse } from "../lib";

import { getCourses } from "./getCourses";

export const coursesQueryKey = (year: AdmissionYear) =>
  ["courses", year] as const;

export const useCoursesQuery = (year: AdmissionYear | null) =>
  useQuery({
    queryKey: ["courses", year],
    queryFn: () => getCourses(year!).then((dtos) => dtos.map(normalizeCourse)),
    enabled: year != null,
  });
