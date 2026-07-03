import { useEffect, useMemo } from "react";

import { buildCourseTitleMap, useCoursesQuery } from "@/entities/course";
import { usePlannerStore, useValidatePlan } from "@/entities/roadmap";
import { useIdentifySpecializationsQuery } from "@/entities/specialization";
import { useSettingsStore } from "@/features/settings";
import { toPercent, useDebouncedValue } from "@/shared/lib";
import type { UUID } from "@/shared/model";
import type {
  LinkedCourse,
  LinkedCourseStatus,
  SpecializationProgress,
} from "@/widgets/PlannerSummary";
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
  const { selections, validation, resyncSelections } = usePlannerStore();
  const {
    data: courses,
    isLoading,
    isError,
  } = useCoursesQuery(admissionYear, majorId);

  // Reconcile placed courses against the catalog whenever it loads/changes:
  // refresh display fields, recompute `fixed`, and pin fixed courses into their
  // semester. Idempotent — no-ops when nothing changed.
  useEffect(() => {
    if (!courses) return;
    resyncSelections(
      courses.map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        type: c.type,
        fixedSemester: c.fixedSemester ?? 0,
      })),
    );
  }, [courses, resyncSelections]);

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
    majorId,
  );

  // Show the spinner from the moment the plan changes
  const identifying =
    !sameIds(selectedCourseIds, debouncedCourseIds) || identifyQuery.isFetching;

  // First-load only: header + buttons stay live, the grid shows skeletons.
  const summaryLoading = identifyQuery.isLoading;

  // Resolve linked-course ids to titles for display in the spec cards.
  const titleMap = useMemo(() => buildCourseTitleMap(courses ?? []), [courses]);

  // The request is already scoped to the major chosen in Settings, so the
  // response only contains that major's specializations.
  const plannerSpecializations: SpecializationProgress[] = useMemo(() => {
    const toItems = (ids: UUID[], status: LinkedCourseStatus): LinkedCourse[] =>
      ids
        .map((id) => {
          const title = titleMap.get(id);
          return title ? { id, title, status } : null;
        })
        .filter((item): item is LinkedCourse => item !== null)
        .sort((item1, item2) => item1.title.localeCompare(item2.title));

    return (identifyQuery.data ?? []).map((match) => ({
      title: match.title,
      earnedPct: toPercent(match.coveredCount, match.totalCount),
      availablePct: toPercent(match.canCoverCount, match.totalCount),
      linkedCourses: [
        ...toItems(match.canCoverIds, "available"),
        ...toItems(match.completedIds, "completed"),
        ...toItems(match.cannotCoverIds, "unavailable"),
      ],
    }));
  }, [identifyQuery.data, titleMap]);

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
