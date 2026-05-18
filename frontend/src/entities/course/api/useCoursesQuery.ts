import { useQuery } from "@tanstack/react-query";

import { api } from "@/shared/config";

export const coursesQueryKey = ["courses"] as const;

export function useCoursesQuery() {
  return useQuery({
    queryKey: coursesQueryKey,
    queryFn: () => api.getCourses().then((res) => res.data),
  });
}
