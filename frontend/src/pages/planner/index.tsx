import { useEffect, useMemo } from "react";

import { useCoursesQuery } from "@/entities/course";
import { usePlannerStore, useValidatePlan } from "@/entities/roadmap";
import { useIdentifySpecializationsQuery } from "@/entities/specialization";
import { useSettingsStore } from "@/features/settings";
import { toPercent, useDebouncedValue } from "@/shared/lib";
import type { SpecializationProgress } from "@/widgets/PlannerSummary";
import { PlannerSummary } from "@/widgets/PlannerSummary";
import { SemesterSection } from "@/widgets/SemesterSection";

import {
  beforeIdentifyMajorsDelay,
  beforeValidateRoadmapDelay,
  buildPlannerStats,
  buildSemesters,
} from "./model";

const sameIds = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
};

const PlannerPage = () => {
  const { admissionYear, majorId } = useSettingsStore();
  const { selections, validation } = usePlannerStore();
  const {
    data: courses,
    isLoading,
    isError,
  } = useCoursesQuery(admissionYear, majorId);

  // Re-validate the whole plan whenever the selection settles. Debounced so
  // rapid drag/drop edits collapse into one request; the initial value passes
  // through immediately, so a returning user still sees conflicts on first load.
  const validate = useValidatePlan();
  const debouncedSelections = useDebouncedValue(
    selections,
    beforeValidateRoadmapDelay,
  );
  useEffect(() => {
    if (admissionYear == null) return;
    validate(admissionYear);
  }, [debouncedSelections, admissionYear, validate]);

  // Identify specializations from every course placed in the planner.
  const selectedCourseIds = useMemo(
    () => Object.values(selections).flatMap((list) => list.map((c) => c.id)),
    [selections],
  );

  // Debounce the ids that drive the request: only fire once the selection has been stable
  const debouncedCourseIds = useDebouncedValue(
    selectedCourseIds,
    beforeIdentifyMajorsDelay,
  );
  // Because debounced course ids haven't updated in a meanwhile, query key won't change and query won't fire
  const identifyQuery = useIdentifySpecializationsQuery(
    debouncedCourseIds,
    admissionYear,
  );

  // Show the spinner from the moment the plan changes — while the debounce is
  // still pending the request hasn't fired yet (isFetching is false), so also
  // flag the gap where the live selection hasn't caught up to the debounced one.
  const identifying =
    !sameIds(selectedCourseIds, debouncedCourseIds) || identifyQuery.isFetching;

  // First-load only: header + buttons stay live, the grid shows skeletons.
  // keepPreviousData keeps isLoading false on later updates.
  const summaryLoading = identifyQuery.isLoading;

  // Only show specializations of the major chosen in Settings.
  const plannerSpecializations: SpecializationProgress[] = useMemo(() => {
    const source = identifyQuery.data ?? [];

    return source
      .filter((match) => majorId != null && match.majorId === majorId)
      .map((match) => ({
        title: match.title,
        earnedPct: toPercent(match.coveredCount, match.totalCount),
        availablePct: toPercent(match.canCoverCount, match.totalCount),
      }));
  }, [identifyQuery.data, majorId]);

  // Conflicts are error/warning validation messages across all semesters.
  const conflictCount = useMemo(
    () => validation.reduce((sum, sem) => sum + sem.messages.length, 0),
    [validation],
  );

  const stats = useMemo(
    () => buildPlannerStats(selectedCourseIds.length, conflictCount),
    [selectedCourseIds.length, conflictCount],
  );

  const semesters = useMemo(() => buildSemesters(), [admissionYear]);

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2">
      <PlannerSummary
        stats={stats}
        specializations={plannerSpecializations}
        loading={summaryLoading}
        identifying={identifying}
      />

      {semesters.map((semester) => (
        <SemesterSection
          key={semester.index}
          index={semester.index}
          courses={courses ?? []}
          coursesLoading={isLoading}
          coursesError={isError}
          identifying={identifying}
        />
      ))}
    </div>
  );
};

export default PlannerPage;
