import { TOTAL_SEMESTERS } from "@/shared/constants";
import type { MajorProgress, SummaryStat } from "@/widgets/PlannerSummary";
import type { SemesterSectionProps } from "@/widgets/SemesterSection";

export const PLANNER_STATS: SummaryStat[] = [
  { label: "Курсов выбрано", value: 12, total: 24 },
  { label: "Конфликты", value: 2 },
  { label: "Свободные кредиты", value: 32 },
];

export const PLANNER_MAJORS: MajorProgress[] = [
  { title: "Business", earnedPct: 25, availablePct: 16 },
  { title: "Software Engineering", earnedPct: 16, availablePct: 32 },
  { title: "AI", earnedPct: 52, availablePct: 18 },
];

const SEMESTER_DATE_RANGE = "Сентябрь 2026 - Январь 2027";

// Per-semester static metadata; runtime course data is injected by PlannerPage.
export const SEMESTERS: Pick<SemesterSectionProps, "index" | "dateRange">[] =
  Array.from({ length: TOTAL_SEMESTERS }, (_, i) => ({
    index: i + 1,
    dateRange: SEMESTER_DATE_RANGE,
  }));
