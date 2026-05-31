import { cn } from "@/shared/lib/cn";
import { SegmentedProgress } from "@/shared/ui/segmented-progress";

export interface MajorProgress {
  title: string;
  earnedPct: number;
  availablePct: number;
}

interface LegendRowProps {
  dotClassName: string;
  label: string;
  percent: number;
}

const LegendRow = ({ dotClassName, label, percent }: LegendRowProps) => (
  <div className="flex items-center gap-2 text-sm text-fg-secondary">
    <span className={cn("size-1.5 shrink-0 rounded-full", dotClassName)} />
    <span>{label}</span>
    <span className="ml-auto text-fg-primary text-sm">{percent}%</span>
  </div>
);

export const MajorProgressCard = ({
  title,
  earnedPct,
  availablePct,
}: MajorProgress) => {
  return (
    <div className="flex flex-col gap-3 p-5">
      <span className="text-sm font-semibold text-fg-secondary">{title}</span>

      <SegmentedProgress
        segments={[
          { value: earnedPct, className: "bg-positive" },
          { value: availablePct, className: "bg-categorical-23" },
          {
            value: Math.max(0, 100 - earnedPct - availablePct),
            className: "bg-background-alt",
          },
        ]}
      />

      <div className="flex flex-col gap-1">
        <LegendRow
          dotClassName="bg-positive"
          label="Набрано"
          percent={earnedPct}
        />
        <LegendRow
          dotClassName="bg-categorical-23"
          label="Можно набрать"
          percent={availablePct}
        />
      </div>
    </div>
  );
};
