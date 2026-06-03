import { useQuery } from "@tanstack/react-query";

import type { AdmissionYear } from "@/shared/constants";

import { normalizeMajor } from "../lib";

import { getMajors } from "./getMajors";

export const majorsQueryKey = (year: AdmissionYear) => ["majors", year] as const;

export const useMajorsQuery = (year: AdmissionYear | null) =>
  useQuery({
    queryKey: ["majors", year],
    queryFn: () => getMajors(year!).then((dtos) => dtos.map(normalizeMajor)),
    enabled: year != null,
  });
