import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/shared/lib/cn";

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border border-transparent py-0.5 font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-fg-primary [a]:hover:bg-primary/80",
        secondary: "bg-secondary text-fg-secondary [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-fg-negative focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline: "border-border text-fg-primary [&>svg]:text-fg-tertiary",
        blue: "bg-sure-blue-pale text-fg-sure-blue [&>svg]:text-fg-sure-blue",
        yellow:
          "bg-optimistic-t-yellow-pale text-fg-optimistic-t-yellow [&>svg]:text-fg-optimistic-t-yellow",
        red: "bg-negative-pale text-fg-negative [&>svg]:text-fg-negative",
        green: "bg-positive-pale text-fg-positive [&>svg]:text-fg-positive",
        orange:
          "bg-expert-orange-pale text-fg-expert-orange [&>svg]:text-fg-expert-orange",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        "3xs": "h-5 px-1 text-xs [&>svg]:size-3! rounded",
        xxs: "h-6 px-1.5 text-sm [&>svg]:size-4! rounded-lg",
        xs: "h-8 px-2 text-sm [&>svg]:size-5! rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "3xs",
    },
  },
);

function Badge({
  className,
  variant = "default",
  size = "3xs",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
