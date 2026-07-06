import { Skeleton } from "@/shared/ui";

export const ChipSkeletonRow = ({ widths }: { widths: number[] }) => (
  <div className="flex gap-2 overflow-hidden">
    {widths.map((width, index) => (
      <Skeleton
        key={index}
        className="h-8 shrink-0 rounded-full"
        style={{ width }}
      />
    ))}
  </div>
);
