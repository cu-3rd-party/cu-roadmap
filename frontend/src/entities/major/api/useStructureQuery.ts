import { useQuery } from "@tanstack/react-query";

import { normalizeStructure } from "../lib";

import { getStructure } from "./getStructure";

/* Unlike the other key factories in this entity, this one is live: the create
   specialization mutation invalidates it to refetch the tree. */
export const structureQueryKey = () => ["majors", "structure"] as const;

export const useStructureQuery = () =>
  useQuery({
    queryKey: structureQueryKey(),
    queryFn: () => getStructure().then(normalizeStructure),
  });
