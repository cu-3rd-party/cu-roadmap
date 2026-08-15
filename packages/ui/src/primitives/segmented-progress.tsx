import { motion } from "framer-motion";
import * as React from "react";

import { cn } from "../lib/cn";

export interface ProgressSegment {
  value: number;
  className: string;
  // Stable identity so animated segments are reused (and tween) across renders.
  key?: string;
}

interface SegmentedProgressProps extends React.ComponentProps<"div"> {
  segments: ProgressSegment[];
  // When true, segments tween their width (flex-grow) on value changes and a
  // segment shrinking to 0 collapses smoothly instead of unmounting.
  animated?: boolean;
}

function SegmentedProgress({
  segments,
  animated,
  className,
  ...props
}: SegmentedProgressProps) {
  return (
    <div
      data-slot="segmented-progress"
      className={cn("flex h-3 w-full gap-0.5", className)}
      {...props}
    >
      {animated
        ? segments.map((segment, index) => (
            <motion.div
              key={segment.key ?? index}
              className={cn("h-full min-w-0 rounded-xs", segment.className)}
              style={{ flexBasis: 0 }}
              initial={false}
              animate={{ flexGrow: segment.value }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          ))
        : segments
            .filter((segment) => segment.value > 0)
            .map((segment, index) => (
              <div
                key={segment.key ?? index}
                className={cn("h-full min-w-0 rounded-xs", segment.className)}
                style={{ flexGrow: segment.value, flexBasis: 0 }}
              />
            ))}
    </div>
  );
}

export { SegmentedProgress };
