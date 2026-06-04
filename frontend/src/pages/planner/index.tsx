import { useEffect, useMemo, useRef, useState } from "react";

import { useCoursesQuery } from "@/entities/course";
import type { MajorMatch } from "@/entities/major";
import { useIdentifyMajorsQuery, useMajorsQuery } from "@/entities/major";
import { usePlannerStore, useValidatePlan } from "@/entities/roadmap";
import { useSettingsStore } from "@/features/settings";
import { toPercent } from "@/shared/lib";
import type { MajorProgress } from "@/widgets/PlannerSummary";
import { PlannerSummary } from "@/widgets/PlannerSummary";
import { SemesterSection } from "@/widgets/SemesterSection";

import { buildPlannerStats, buildSemesters } from "./model";

const PlannerPage = () => {
  const { admissionYear } = useSettingsStore();
  const { selections, validation } = usePlannerStore();
  const { data: courses, isLoading, isError } = useCoursesQuery(admissionYear);

  // Validate once on first load so a returning user immediately sees the conflicts
  const validate = useValidatePlan();
  const validatedOnMount = useRef(false);
  useEffect(() => {
    if (validatedOnMount.current || admissionYear == null) return;
    validatedOnMount.current = true;
    validate(admissionYear);
  }, [admissionYear, validate]);

  // Identify majors from every course placed in the planner.
  const selectedCourseIds = useMemo(
    () => Object.values(selections).flatMap((list) => list.map((c) => c.id)),
    [selections],
  );
  const identifyQuery = useIdentifyMajorsQuery(
    selectedCourseIds,
    admissionYear,
  );
  const majorsQuery = useMajorsQuery(admissionYear);

  // Remember the last result produced while courses were selected. When the
  // planner is emptied we keep showing the same major cards (titles) with 0%
  // instead of clearing them.
  const noCourses = selectedCourseIds.length === 0;
  const [lastMatches, setLastMatches] = useState<MajorMatch[]>([]);
  useEffect(() => {
    if (!noCourses && identifyQuery.data) setLastMatches(identifyQuery.data);
  }, [noCourses, identifyQuery.data]);

  // First-load only: header + buttons stay live, the 6-cell grid shows
  // skeletons. keepPreviousData keeps isLoading false on later updates.
  const summaryLoading = identifyQuery.isLoading || majorsQuery.isLoading;

  // Resolve display titles from the real majors list, matched by id.
  const majorTitleById = useMemo(
    () => new Map((majorsQuery.data ?? []).map((m) => [m.id, m.title])),
    [majorsQuery.data],
  );

  const plannerMajors: MajorProgress[] = useMemo(() => {
    // With no courses, reuse the previous matches' titles (or the initial
    // mount data if nothing has been selected yet) and zero out the progress.
    const source = noCourses
      ? lastMatches.length > 0
        ? lastMatches
        : (identifyQuery.data ?? [])
      : (identifyQuery.data ?? []);

    return source.map((match) => ({
      title: majorTitleById.get(match.id) ?? match.title,
      earnedPct: noCourses
        ? 0
        : toPercent(match.coveredCount, match.totalCount),
      availablePct: noCourses
        ? 0
        : toPercent(match.canCoverCount, match.totalCount),
    }));
  }, [noCourses, lastMatches, identifyQuery.data, majorTitleById]);

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
