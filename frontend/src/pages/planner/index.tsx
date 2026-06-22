import { useEffect, useMemo } from "react";

import { useCoursesQuery } from "@/entities/course";
import {
  useIdentifyMajorsQuery,
  useIdentifySpecializationsQuery,
  useMajorsQuery,
} from "@/entities/major";
import { usePlannerStore, useValidatePlan } from "@/entities/roadmap";
import { useSettingsStore } from "@/features/settings";
import { toPercent, useDebouncedValue } from "@/shared/lib";
import type { MajorProgress } from "@/widgets/PlannerSummary";
import { PlannerSummary } from "@/widgets/PlannerSummary";
import { SemesterSection } from "@/widgets/SemesterSection";

import {
  beforeIdentifyMajorsDelay,
  beforeValidateRoadmapDelay,
  buildPlannerStats,
  buildSemesters,
} from "./model";

const PlannerPage = () => {
  const { admissionYear, majorId: settingsMajorId } = useSettingsStore();
  const { selections, validation } = usePlannerStore();
  const { data: courses, isLoading, isError } = useCoursesQuery(admissionYear);

  // Re-validate the whole plan whenever the selection settles. Debounced so
  // rapid drag/drop edits collapse into one request; the initial value passes
  // through immediately, so a returning user still sees conflicts on first load.
  const validate = useValidatePlan();
  const debouncedSelections = useDebouncedValue(
    selections,
    beforeValidateRoadmapDelay,
  );

  // Identify majors from every course placed in the planner.
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
  const identifyQuery = useIdentifyMajorsQuery(
    debouncedCourseIds,
    admissionYear,
  );
  const identifySpecializationsQuery = useIdentifySpecializationsQuery(
    debouncedCourseIds,
    admissionYear,
  );

  const selectedSpecMatch = useMemo(() => {
    return identifySpecializationsQuery.data?.find(
      (m) => m.id === settingsMajorId,
    );
  }, [identifySpecializationsQuery.data, settingsMajorId]);

  useEffect(() => {
    if (admissionYear == null) return;
    const actualMajorId = selectedSpecMatch
      ? selectedSpecMatch.major_id
      : settingsMajorId;
    const actualSpecId =
      selectedSpecMatch && selectedSpecMatch.id !== selectedSpecMatch.major_id
        ? selectedSpecMatch.id
        : undefined;
    validate(admissionYear, actualMajorId, actualSpecId);
  }, [
    debouncedSelections,
    admissionYear,
    validate,
    selectedSpecMatch,
    settingsMajorId,
  ]);

  const majorsQuery = useMajorsQuery(admissionYear);

  // First-load only: header + buttons stay live, the 6-cell grid shows
  // skeletons. keepPreviousData keeps isLoading false on later updates.
  const summaryLoading =
    identifyQuery.isLoading ||
    majorsQuery.isLoading ||
    identifySpecializationsQuery.isLoading;

  // Resolve display titles from the real majors list, matched by id.
  const majorTitleById = useMemo(
    () => new Map((majorsQuery.data ?? []).map((m) => [m.id, m.title])),
    [majorsQuery.data],
  );

  const plannerMajors: MajorProgress[] = useMemo(() => {
    let source;
    if (settingsMajorId) {
      source = (identifySpecializationsQuery.data ?? []).filter(
        (s) => s.majorId === settingsMajorId,
      );
    } else {
      source = identifyQuery.data ?? [];
    }

    return source.map((match) => ({
      title: majorTitleById.get(match.id) ?? match.title,
      earnedPct: toPercent(match.coveredCount, match.totalCount),
      availablePct: toPercent(match.canCoverCount, match.totalCount),
    }));
  }, [
    identifyQuery.data,
    identifySpecializationsQuery.data,
    majorTitleById,
    settingsMajorId,
  ]);

  // Conflicts are error/warning validation messages across all semesters.
  const conflictCount = useMemo(
    () => validation.reduce((sum, sem) => sum + sem.messages.length, 0),
    [validation],
  );

  const stats = useMemo(
    () => buildPlannerStats(selectedCourseIds.length, conflictCount),
    [selectedCourseIds.length, conflictCount],
  );

  const semesters = useMemo(
    () => buildSemesters(admissionYear),
    [admissionYear],
  );

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2">
      <PlannerSummary
        stats={stats}
        majors={plannerMajors}
        loading={summaryLoading}
      />

      {semesters.map((semester) => (
        <SemesterSection
          key={semester.index}
          index={semester.index}
          dateRange={semester.dateRange}
          courses={courses ?? []}
          coursesLoading={isLoading}
          coursesError={isError}
        />
      ))}
    </div>
  );
};

export default PlannerPage;
