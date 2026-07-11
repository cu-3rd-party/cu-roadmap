// DELETABLE: The summary stat cards were removed from the Planner because they
// weren't useful for now.
import { AnimatedNumber } from "@/shared/ui";

export interface SummaryStat {
  label: string;
  value: number;
  total?: number | string;
  decimals?: number;
}

export const SummaryStatCard = ({
  label,
  value,
  total,
  decimals,
}: SummaryStat) => {
  return (
    <div className="flex flex-col gap-2 px-1 sm:px-6 py-3 sm:py-4.5">
      <span className="text-center text-xs sm:text-sm text-fg-secondary font-semibold">
        {label}
      </span>
      <div className="flex justify-center items-baseline gap-1">
        <AnimatedNumber
          className="text-2xl font-bold text-fg-primary"
          value={value}
          decimals={decimals}
        />
        {total !== undefined && (
          <span className="text-sm text-fg-tertiary">/ {total}</span>
        )}
      </div>
    </div>
  );
};
