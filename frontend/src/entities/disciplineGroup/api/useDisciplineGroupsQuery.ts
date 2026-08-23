import { useQuery } from "@tanstack/react-query";

import { sortKey } from "@/shared/lib";

import { normalizeDisciplineGroup } from "../lib";

import { getDisciplineGroups } from "./getDisciplineGroups";

export const disciplineGroupsQueryKey = () => ["discipline-groups"] as const;

/* `enabled` is a visibility gate, not a data one: the requisite modals stay
   mounted while closed, and there is no reason to fetch every box until one is
   actually opened. Sorted like useAdminCoursesQuery so both picker tabs read the
   same way. */
export const useDisciplineGroupsQuery = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: disciplineGroupsQueryKey(),
    queryFn: () =>
      getDisciplineGroups().then((dtos) =>
        dtos
          .map(normalizeDisciplineGroup)
          .sort((a, b) => sortKey(a.title).localeCompare(sortKey(b.title))),
      ),
    enabled,
  });
