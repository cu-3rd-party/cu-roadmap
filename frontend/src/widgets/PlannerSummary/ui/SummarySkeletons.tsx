import { Skeleton } from "@/shared/ui";

// DELETABLE: `SummaryStatCardSkeleton` pairs with the removed summary stat cards
export const SummaryStatCardSkeleton = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center gap-2 px-6 py-4.5">
    <span className="text-center text-xs sm:text-sm text-fg-secondary font-semibold">
      {label}
    </span>
    <Skeleton className="h-8 w-5" />
  </div>
);

// Mirrors SpecializationProgressCard
export const SpecializationProgressCardSkeleton = () => (
  <div className="flex flex-col gap-3 p-3 sm:p-5 sm:py-3">
    {/* Title — centered and reserving two lines, like the real card */}
    <div className="flex min-h-[2lh] items-center justify-center">
      <Skeleton className="h-4 w-28" />
    </div>

    {/* SegmentedProgress bar */}
    <Skeleton className="h-3 w-full rounded-xs" />

    {/* Two legend rows: dot + label + trailing percent */}
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Skeleton className="size-1.5 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="ml-auto h-4 w-8" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="size-1.5 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="ml-auto h-4 w-8" />
      </div>
    </div>

    {/* "Связанные курсы" toggle row: label + chevron */}
    <div className="flex items-center justify-between gap-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="size-5 shrink-0 rounded-md" />
    </div>
  </div>
);
