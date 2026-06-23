import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import type { AdmissionYear } from "@/shared/constants";
import { sortKey } from "@/shared/lib";
import type { UUID } from "@/shared/model";

import { normalizeCourse } from "../lib";
import type { Course } from "../model";

import { getCourses } from "./getCourses";

export const coursesQueryKey = (year: AdmissionYear) =>
  ["courses", year] as const;

// majorId only enriches each course with its requirement type for the selected major
export const useCoursesQuery = (
  year: AdmissionYear | null,
  majorId: UUID | null = null,
) =>
  useQuery({
    queryKey: ["courses", year],
    queryFn: () =>
      getCourses(year!).then((dtos) =>
        dtos
          .map(normalizeCourse)
          .sort((a, b) => sortKey(a.title).localeCompare(sortKey(b.title))),
      ),
    select: useCallback(
      (courses: Course[]) =>
        courses.map((course) => ({
          ...course,
          majorRequirement: majorId
            ? (course.toMajor?.[majorId] ?? null)
            : null,
        })),
      [majorId],
    ),
    enabled: year != null,
  });
