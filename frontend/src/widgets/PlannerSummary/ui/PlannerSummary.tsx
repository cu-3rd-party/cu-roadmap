import { Loader2, RotateCcw, Sparkles, Waypoints } from "lucide-react";
import { useState } from "react";

import { usePlannerStore } from "@/entities/roadmap";
import { useSettingsStore } from "@/features/settings";
import { TrajectorySelectModal } from "@/features/trajectory-select";
import { plannerStatsLabels } from "@/pages/planner/model";
import { admissionYearToSemester } from "@/shared/constants";
import { useMediaQuery } from "@/shared/lib";
import { Button, Checkbox, Chip, Label, Panel } from "@/shared/ui";

import { type MajorProgress, MajorProgressCard } from "./MajorProgressCard";
import { ResetConfirmModal } from "./ResetConfirmModal";
import {
  MajorProgressCardSkeleton,
  SummaryStatCardSkeleton,
} from "./Skeletons";
import { type SummaryStat, SummaryStatCard } from "./SummaryStatCard";

interface PlannerSummaryProps {
  stats: SummaryStat[];
  majors: MajorProgress[];
  loading?: boolean;
  identifying?: boolean;
}

export const PlannerSummary = ({
  stats,
  majors,
  loading,
  identifying,
}: PlannerSummaryProps) => {
  const { reset } = usePlannerStore();
  const isMobile = useMediaQuery("md");
  const { admissionYear, hideCompletedSemesters, setHideCompletedSemesters } =
    useSettingsStore();
  const [trajectoryOpen, setTrajectoryOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const handleReset = (keepCompleted: boolean) => {
    reset(
      keepCompleted && admissionYear != null
        ? admissionYearToSemester[admissionYear]
        : undefined,
    );
  };

  return (
    <Panel className="flex flex-col gap-4 px-2 sm:px-4 lg:px-6">
      <div className="mb-4 flex flex-col gap-3 px-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Chip variant="blue" size={isMobile ? "xs" : "sm"}>
              <Waypoints />
            </Chip>
            <div className="flex gap-2 items-center">
              <h1 className="text-2xl font-bold text-fg-primary">
                Планировщик
              </h1>
              {identifying && (
                <Loader2
                  className="size-4 animate-spin text-fg-secondary mt-0.5"
                  aria-label="Загрузка…"
                />
              )}
            </div>
          </div>

          <div className="flex justify-center gap-4 lg:gap-6">
            <Button
              variant="outline"
              size="sm"
              className={isMobile ? "text-fg-expert-blue border-0" : undefined}
              icon={isMobile ? <Sparkles /> : undefined}
              onClick={() => setTrajectoryOpen(true)}
            >
              {isMobile ? undefined : "Подбор траектории"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-negative hover:text-fg-negative ${isMobile && "border-0"}`}
              icon={isMobile ? <RotateCcw /> : undefined}
              onClick={() => setResetOpen(true)}
            >
              {isMobile ? undefined : "Сбросить всё"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm text-fg-secondary">
            Расставь курсы по семестрам и собери свой план обучения!
          </p>
          <p className="text-sm text-fg-secondary">
            Карточки в одном семестре можно менять местами через перетягивание.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="hide-completed-semesters"
            checked={hideCompletedSemesters}
            onCheckedChange={(checked) =>
              setHideCompletedSemesters(checked === true)
            }
          />
          <Label
            htmlFor="hide-completed-semesters"
            className="cursor-pointer text-sm font-normal text-fg-secondary"
          >
            Скрыть пройденные семестры
          </Label>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {/* Summary stats — always a row of three */}
        <div className="grid grid-cols-3 border-b [&>*:not(:nth-child(3n))]:border-r">
          {loading
            ? plannerStatsLabels.map((label) => (
                <SummaryStatCardSkeleton
                  key={`stat-skeleton-${label}`}
                  label={label}
                />
              ))
            : stats.map((stat) => (
                <SummaryStatCard key={stat.label} {...stat} />
              ))}
        </div>

        {/* Major progress — column under sm, row of three at sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 [&>*:not(:last-child)]:border-b sm:[&>*:not(:last-child)]:border-b-0 sm:[&>*:not(:nth-child(3n))]:border-r">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <MajorProgressCardSkeleton key={`major-skeleton-${i}`} />
              ))
            : majors.map((major) => (
                <MajorProgressCard key={major.title} {...major} />
              ))}
        </div>
      </div>

      <TrajectorySelectModal
        open={trajectoryOpen}
        onOpenChange={setTrajectoryOpen}
      />

      <ResetConfirmModal
        open={resetOpen}
        onOpenChange={setResetOpen}
        onConfirm={handleReset}
      />
    </Panel>
  );
};
