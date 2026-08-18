import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/shared/lib/cn";

const chipVariants = cva(
  [
    "group/chip inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full select-none",
    "py-0.5 font-medium whitespace-nowrap transition-all duration-(--std-duration)",
    "has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:pointer-events-none",
    "text-fg-primary [&>svg]:text-fg-tertiary",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "",
        blue: "bg-expert-blue-pale text-fg-expert-blue [&>svg]:text-fg-expert-blue",
        yellow:
          "bg-optimistic-t-yellow-pale text-fg-optimistic-t-yellow [&>svg]:text-fg-optimistic-t-yellow",
        red: "bg-negative-pale text-fg-negative [&>svg]:text-fg-negative",
        green: "bg-positive-pale text-fg-positive [&>svg]:text-fg-positive",
        orange:
          "bg-expert-orange-pale text-fg-expert-orange [&>svg]:text-fg-expert-orange",
        action: "border cursor-pointer",
        counter: "border cursor-pointer has-[data-slot=counter]:pr-0.5",
      },
      size: {
        "3xs": "h-5 px-1 text-xs [&>svg]:size-3!",
        xxs: "h-6 px-1.5 text-sm [&>svg]:size-4!",
        xs: "h-8 px-2 text-sm [&>svg]:size-4!",
        sm: "h-10 px-2.5 text-sm [&>svg]:size-5!",
      },
      active: {
        false: "border-border hover:text-fg-hover hover:border-border-hover",
        true: "border-transparent bg-accent text-accent-opposite [&>svg]:text-accent-opposite",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "3xs",
      active: false,
    },
  },
);

function Chip({
  className,
  variant = "default",
  size = "3xs",
  active = false,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof chipVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="chip"
      data-variant={variant}
      data-active={active}
      className={cn(chipVariants({ variant, size, active }), className)}
      {...props}
    />
  );
}

export { Chip, chipVariants };
