import { Skeleton } from "@/shared/ui";

// Mirrors SummaryStatCard: label line + larger value block.
export const SummaryStatCardSkeleton = () => (
  <div className="flex flex-col gap-2 px-6 py-4.5">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-7 w-16" />
  </div>
);

// Mirrors MajorProgressCard: title + progress bar + two legend rows.
export const MajorProgressCardSkeleton = () => (
  <div className="flex flex-col gap-3 p-5">
    <Skeleton className="h-4 w-28" />
    <Skeleton className="h-3 w-full rounded-xs" />
    <div className="flex flex-col gap-1">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
    </div>
  </div>
);
