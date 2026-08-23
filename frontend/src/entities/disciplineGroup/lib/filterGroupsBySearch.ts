import type { DisciplineGroup } from "../model/types";

/* Title-only search over a fetched list of groups. A group has no description to
   match on, which is what makes this narrower than filterCoursesBySearch.

   Lives in the entity rather than a feature slice because two features now search
   groups: the requisite picker and the admin Коробки grid. */
export const filterGroupsBySearch = (
  groups: DisciplineGroup[],
  search: string,
): DisciplineGroup[] => {
  const query = search.trim().toLowerCase();
  if (query.length === 0) return groups;
  return groups.filter((group) => group.title.toLowerCase().includes(query));
};
