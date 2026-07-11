import { TOTAL_SEMESTERS } from "@/shared/constants";
import type { SummaryStat } from "@/widgets/PlannerSummary";
import type { SemesterSectionProps } from "@/widgets/SemesterSection";

// DELETABLE: The summary stat cards were removed from the Planner because they
// weren't useful for now.
export const buildPlannerStats = (): SummaryStat[] => [];

// Per-semester static metadata; runtime course data is injected by PlannerPage.
// Date ranges are derived from the admission year.
export const buildSemesters = (): Pick<SemesterSectionProps, "index">[] =>
  Array.from({ length: TOTAL_SEMESTERS }, (_, i) => ({
    index: i + 1,
  }));

// Delay for debounce
export const beforeIdentifyMajorsDelay = 2000;
export const beforeValidateRoadmapDelay = 2000;
