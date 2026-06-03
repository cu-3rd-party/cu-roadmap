import { Skeleton } from "@/shared/ui";

export const ChipSkeletonRow = ({ widths }: { widths: number[] }) => (
  <div className="flex flex-wrap gap-2">
    {widths.map((width, index) => (
      <Skeleton key={index} className="h-8 rounded-full" style={{ width }} />
    ))}
  </div>
);
