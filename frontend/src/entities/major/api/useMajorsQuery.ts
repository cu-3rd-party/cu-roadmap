import { useQuery } from "@tanstack/react-query";

import { api } from "@/shared/config";

export const majorsQueryKey = ["majors"] as const;

export function useMajorsQuery() {
  return useQuery({
    queryKey: majorsQueryKey,
    queryFn: () => api.getMajors().then((res) => res.data),
  });
}
