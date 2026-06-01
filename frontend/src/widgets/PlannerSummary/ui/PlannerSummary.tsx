import { Waypoints } from "lucide-react";

import { usePlannerStore } from "@/entities/roadmap";
import { Button, Chip, Panel } from "@/shared/ui";

import { type MajorProgress, MajorProgressCard } from "./MajorProgressCard";
import { type SummaryStat, SummaryStatCard } from "./SummaryStatCard";

interface PlannerSummaryProps {
  stats: SummaryStat[];
  majors: MajorProgress[];
}

export const PlannerSummary = ({ stats, majors }: PlannerSummaryProps) => {
  const { reset } = usePlannerStore();

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
              <br />
              Курсы можно перетягивать между семестрами
            </p>
          </div>
        </div>

        <div className="flex justify-center gap-6">
          <Button
            variant="outline"
            size="sm"
          >
            Рекомендация
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-negative hover:text-fg-negative"
            onClick={() => reset()}
          >
            Сбросить всё
          </Button>
        </div>

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
