import { Skeleton } from "@/shared/ui";

export const SummaryStatCardSkeleton = ({ label }: { label: string }) => (
  <div className="flex flex-col gap-2 px-6 py-4.5">
    <span className="text-center sm:text-start text-xs sm:text-sm text-fg-secondary font-semibold">
      {label}
    </span>
    <Skeleton className="h-8 w-5" />
  </div>
);

// Mirrors SpecializationCard: title + progress bar + two legend rows.
export const SpecializationProgressCardSkeleton = () => (
  <div className="flex flex-col gap-3 p-5">
    <Skeleton className="h-4 w-28" />
    <Skeleton className="h-3 w-full rounded-xs" />
    <div className="flex flex-col gap-1">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
    </div>
  </div>
);
