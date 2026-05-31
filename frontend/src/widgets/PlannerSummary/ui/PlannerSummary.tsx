import { Waypoints } from "lucide-react";

import { Button } from "@/shared/ui/kit/button";
import { Chip } from "@/shared/ui/kit/chip";
import { Panel } from "@/shared/ui/panel";

import { type MajorProgress, MajorProgressCard } from "./MajorProgressCard";
import { type SummaryStat, SummaryStatCard } from "./SummaryStatCard";

interface PlannerSummaryProps {
  stats: SummaryStat[];
  majors: MajorProgress[];
}

export const PlannerSummary = ({ stats, majors }: PlannerSummaryProps) => {
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
              Расставь курсы по семестрам и собери свой план обучения
            </p>
          </div>
        </div>

        <Button
          variant="tertiary"
          size="sm"
          className="text-negative hover:text-negative"
        >
          Сбросить всё
        </Button>
      </div>

      <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-border [&>*:not(:nth-child(3n))]:border-r [&>*:nth-child(-n+3)]:border-b">
        {stats.map((stat) => (
          <SummaryStatCard key={stat.label} {...stat} />
        ))}
        {majors.map((major) => (
          <MajorProgressCard key={major.title} {...major} />
        ))}
      </div>
    </Panel>
  );
};
