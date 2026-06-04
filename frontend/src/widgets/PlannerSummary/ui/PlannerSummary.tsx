import { Waypoints } from "lucide-react";
import { useState } from "react";

<<<<<<< HEAD
import { usePlannerStore, useValidatePlan } from "@/entities/roadmap";
=======
import { usePlannerStore } from "@/entities/roadmap";
>>>>>>> feature/ui-rework
import { useSettingsStore } from "@/features/settings";
import { TrajectorySelectModal } from "@/features/trajectory-select";
import { admissionYearToSemester } from "@/shared/constants";
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
}

export const PlannerSummary = ({
  stats,
  majors,
  loading,
}: PlannerSummaryProps) => {
  const { reset } = usePlannerStore();
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
    <Panel className="flex flex-col gap-4">
      <div className="mb-4 flex items-start justify-between gap-4 px-1">
        <div className="flex items-center gap-4">
          <Chip variant="blue" size="sm">
            <Waypoints />
          </Chip>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-fg-primary">
              Планировщик траектории
            </h1>
            <p className="text-sm text-fg-secondary">
              Расставь курсы по семестрам и собери свой план обучения.
            </p>
            <div className="mt-1 flex items-center gap-2">
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
        </div>

        <div className="flex justify-center gap-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTrajectoryOpen(true)}
          >
            Подбор траектории
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-negative hover:text-fg-negative"
            onClick={() => setResetOpen(true)}
          >
            Сбросить всё
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-border [&>*:not(:nth-child(3n))]:border-r [&>*:nth-child(-n+3)]:border-b">
        {loading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <SummaryStatCardSkeleton key={`stat-skeleton-${i}`} />
            ))}
            {Array.from({ length: 3 }).map((_, i) => (
              <MajorProgressCardSkeleton key={`major-skeleton-${i}`} />
            ))}
          </>
        ) : (
          <>
            {stats.map((stat) => (
              <SummaryStatCard key={stat.label} {...stat} />
            ))}
            {majors.map((major) => (
              <MajorProgressCard key={major.title} {...major} />
            ))}
          </>
        )}
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
