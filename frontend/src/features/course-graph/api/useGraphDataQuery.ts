import { useQuery } from "@tanstack/react-query";

import { api } from "@/shared/config";

export const graphDataQueryKey = ["graph-data"] as const;

export function useGraphDataQuery() {
  return useQuery({
    queryKey: graphDataQueryKey,
    queryFn: () => api.getGraphData().then((res) => res.data),
  });
}
