import { AnimatedNumber } from "@/shared/ui";

export interface SummaryStat {
  label: string;
  value: number;
  total?: number | string;
}

export const SummaryStatCard = ({ label, value, total }: SummaryStat) => {
  return (
    <div className="flex flex-col gap-2 px-1 sm:px-6 py-3 sm:py-4.5">
      <span className="text-center sm:text-start text-xs sm:text-sm text-fg-secondary font-semibold">
        {label}
      </span>
      <div className="flex justify-center sm:justify-start items-baseline gap-1">
        <AnimatedNumber
          className="text-2xl font-bold text-fg-primary"
          value={value}
        />
        {total !== undefined && (
          <span className="text-sm text-fg-tertiary">/ {total}</span>
        )}
      </div>
    </div>
  );
};
