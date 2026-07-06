import { Skeleton } from "@/shared/ui";
import { Panel } from "@/shared/ui/panel";

const CourseCardSkeleton = () => (
  <div className="flex h-full flex-col gap-2 rounded-xl bg-background px-3 py-4">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <div className="mt-auto flex flex-wrap gap-1 pt-4">
      <Skeleton className="h-4 w-14 rounded-full" />
      <Skeleton className="h-4 w-10 rounded-full" />
      <Skeleton className="h-4 w-10 rounded-full" />
    </div>
  </div>
);

export const CoursesSectionSkeleton = ({ cards = 6 }: { cards?: number }) => (
  <Panel>
    <div className="mb-4 flex items-center justify-between gap-2 px-1">
      <Skeleton className="h-6 w-48" />
    </div>

    <div className="grid gap-1 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {Array.from({ length: cards }).map((_, index) => (
        <CourseCardSkeleton key={index} />
      ))}
    </div>
  </Panel>
);
