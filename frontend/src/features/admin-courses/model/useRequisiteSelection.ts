import { useCallback, useState } from "react";

import type { UUID } from "@/shared/model";

/* Courses and boxes live in different tables, so a bare uuid would be ambiguous.
   The prefix is also the discriminator a future save payload needs. */
export type RequisiteKey = `course:${UUID}` | `group:${UUID}`;

export const courseKey = (id: UUID): RequisiteKey => `course:${id}`;
export const groupKey = (id: UUID): RequisiteKey => `group:${id}`;

/* One instance per panel, so the prerequisite and corequisite pickers cannot
   contaminate each other. Purely visual for now: nothing is persisted, and the
   selection is deliberately not linked to the cards already in the panel. */
export const useRequisiteSelection = () => {
  const [open, setOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<RequisiteKey>>(
    new Set(),
  );

  const toggle = useCallback((key: RequisiteKey) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }, []);

  return { open, setOpen, selectedKeys, toggle };
};
