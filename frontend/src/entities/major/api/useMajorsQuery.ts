import { useQuery } from "@tanstack/react-query";

import type { AdmissionYear } from "@/shared/constants";

import { normalizeMajor } from "../lib";

import { getMajors } from "./getMajors";

export const majorsQueryKey = (year: AdmissionYear) =>
  ["majors", year] as const;

export const useMajorsQuery = (year: AdmissionYear | null) =>
  useQuery({
    queryKey: ["majors", year],
    queryFn: () =>
      getMajors(year!).then((dtos) =>
        dtos.map(normalizeMajor).sort((a, b) => a.title.localeCompare(b.title)),
      ),
    enabled: year != null,
  });

export const useAllMajorsQuery = () =>
  useQuery({
    queryKey: ["majors", "all"],
    queryFn: () =>
      getMajors().then((dtos) =>
        dtos.map(normalizeMajor).sort((a, b) => a.title.localeCompare(b.title)),
      ),
  });
