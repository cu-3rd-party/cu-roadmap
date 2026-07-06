import { useEffect } from "react";

import { type Major, useMajorsQuery } from "@/entities/major";
import type { MajorType, UUID } from "@/shared/model";

import { useSettingsStore } from "./store";

/*
  Pure reconcile decision: given the freshly-fetched majors for the cohort and
  the persisted selection, return the id we should adopt, or `null` to keep the
  current one. A backend regeneration keeps a major's `type` but changes its
  `id`, so we re-anchor on `type`.
*/

export const resolveMajorId = (
  majors: Major[] | undefined,
  majorType: MajorType | null,
  majorId: UUID | null,
): UUID | null => {
  if (!majors || !majorType) return null;
  const match = majors.find((m) => m.type === majorType);
  // no major of that type offered anymore, or id already current — no-op
  if (!match || match.id === majorId) return null;
  return match.id;
};

/*
  Self-healing for the persisted major selection: once the cohort's majors
  load, if a major of the saved type exists under a different id (backend
  regenerated it), adopt the fresh id. Selections are left untouched — it's the
  same major, only the id changed. Mount once, globally.
*/
export const useResyncMajor = () => {
  const { admissionYear, majorId, majorType, setMajor } = useSettingsStore();
  const { data: majors } = useMajorsQuery(admissionYear);

  useEffect(() => {
    const resolved = resolveMajorId(majors, majorType, majorId);
    if (resolved) setMajor(resolved, majorType);
  }, [majors, majorType, majorId, setMajor]);
};
