import { Skeleton } from "@/shared/ui/kit";

/* Placeholder matching a course/requisite tile. Lives in shared because the
   select-modal shell renders it while loading and cannot import from entities. */
export const CardSkeleton = () => (
  <div className="flex h-full flex-col gap-2 rounded-xl bg-background px-3 py-4">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <div className="mt-auto flex flex-wrap gap-1 pt-4">
      <Skeleton className="h-4 w-14 rounded-full" />
      <Skeleton className="h-4 w-10 rounded-full" />
    </div>
  </div>
);
