import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/cn";

const counterVariants = cva(
  "inline-flex items-center justify-center rounded-full font-medium tabular-nums transition-colors duration-(--std-duration)",
  {
    variants: {
      variant: {
        primary: "bg-accent text-fg-primary-opposite",
        secondary: "bg-accent-pale text-fg-primary",
        contrast: "bg-negative text-fg-primary-opposite",
        positive: "bg-positive text-fg-primary-opposite",
      },
      size: {
        "4xs": "size-4",
        "3xs": "h-5 min-w-5 px-[5.5px] text-xs",
        xxs: "h-6 min-w-6 px-[6px] text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "3xs",
    },
  },
);

function Counter({
  className,
  variant = "primary",
  size = "3xs",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof counterVariants>) {
  return (
    <span
      data-slot="counter"
      data-variant={variant}
      className={cn(counterVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Counter, counterVariants };
