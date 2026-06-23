import { cn } from "@/shared/lib/cn";
import { AnimatedNumber } from "@/shared/ui/animated-number";
import { SegmentedProgress } from "@/shared/ui/segmented-progress";

export interface SpecializationProgress {
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
    <span className="text-xs sm:text-sm">{label}</span>
    <span className="ml-auto text-fg-primary text-sm">
      <AnimatedNumber value={percent} />%
    </span>
  </div>
);

export const SpecializationProgressCard = ({
  title,
  earnedPct,
  availablePct,
}: SpecializationProgress) => {
  return (
    <div className="flex flex-col gap-3 p-3 sm:p-5">
      <span className="line-clamp-1 text-sm font-semibold text-fg-secondary">
        {title}
      </span>

      <SegmentedProgress
        animated
        segments={[
          { key: "earned", value: earnedPct, className: "bg-positive" },
          {
            key: "available",
            value: availablePct,
            className: "bg-categorical-23",
          },
          {
            key: "remainder",
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
