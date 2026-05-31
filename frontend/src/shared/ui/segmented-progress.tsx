import * as React from "react";

import { cn } from "@/shared/lib/cn";

export interface ProgressSegment {
  value: number;
  className: string;
}

interface SegmentedProgressProps extends React.ComponentProps<"div"> {
  segments: ProgressSegment[];
}

function SegmentedProgress({
  segments,
  className,
  ...props
}: SegmentedProgressProps) {
  return (
    <div
      data-slot="segmented-progress"
      className={cn("flex h-3 w-full gap-0.5", className)}
      {...props}
    >
      {segments
        .filter((segment) => segment.value > 0)
        .map((segment, index) => (
          <div
            key={index}
            className={cn("h-full min-w-0 rounded-xs", segment.className)}
            style={{ flexGrow: segment.value, flexBasis: 0 }}
          />
        ))}
    </div>
  );
}

export { SegmentedProgress };
