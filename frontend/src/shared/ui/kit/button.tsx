import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/shared/lib/cn";

const PADDED_VARIANTS = [
  "default",
  "outline",
  "secondary",
  "navInactive",
  "navActive",
  "ghost",
  "destructive",
  "tertiaryPadded",
  "link",
] as const;

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center",
    "font-medium whitespace-nowrap",
    "transition-colors outline-none select-none cursor-pointer",
    "disabled:pointer-events-none duration-(--std-duration)",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline: [
          "border bg-transparent",
          "border-border text-fg-primary",
          "hover:bg-accent-pale-hover hover:border-border-hover",
          "focus-visible:border-border-focus",
          "active:border-border-pressed",
          "disabled:text-fg-muted disabled:border-border-muted",
        ].join(" "),
        tertiary: [
          "bg-transparent",
          "text-fg-primary",
          "hover:text-fg-hover",
          "focus-visible:border-border-focus",
          "active:border-border-pressed",
          "disabled:text-fg-muted",
        ].join(" "),
        tertiaryPadded: [
          "bg-transparent",
          "text-fg-primary",
          "hover:text-fg-hover",
          "focus-visible:border-border-focus",
          "active:border-border-pressed",
          "disabled:text-fg-muted",
        ].join(" "),
        navInactive: "text-fg-primary hover:bg-accent-pale-hover",
        navActive: "text-fg-primary bg-accent-pale-hover",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground",
        destructive:
          "bg-transparent text-negative hover:bg-negative-pale focus-visible:border-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        xxs: "h-6 rounded-[6px] text-sm",
        xs: "h-8 rounded-[8px] text-sm",
        sm: "h-10 rounded-[10px] text-base",
        md: "h-12 rounded-[11px] text-base",
        lg: "h-14 rounded-[12px] text-lg",
      },
      iconOnly: {
        false: "",
        true: "p-0",
      },
    },
    compoundVariants: [
      // horizontal padding only for padded variants
      {
        size: "xxs",
        iconOnly: false,
        variant: [...PADDED_VARIANTS],
        className: "px-2 gap-1.5",
      },
      {
        size: "xs",
        iconOnly: false,
        variant: [...PADDED_VARIANTS],
        className: "px-3 gap-1.5",
      },
      {
        size: "sm",
        iconOnly: false,
        variant: [...PADDED_VARIANTS],
        className: "px-4 gap-2",
      },
      {
        size: "md",
        iconOnly: false,
        variant: [...PADDED_VARIANTS],
        className: "px-4 gap-2",
      },
      {
        size: "lg",
        iconOnly: false,
        variant: [...PADDED_VARIANTS],
        className: "px-6 gap-2.5",
      },
      // tertiary: gap only, no px
      {
        size: "xxs",
        iconOnly: false,
        variant: "tertiary",
        className: "gap-1.5",
      },
      {
        size: "xs",
        iconOnly: false,
        variant: "tertiary",
        className: "gap-1.5",
      },
      { size: "sm", iconOnly: false, variant: "tertiary", className: "gap-2" },
      { size: "md", iconOnly: false, variant: "tertiary", className: "gap-2" },
      {
        size: "lg",
        iconOnly: false,
        variant: "tertiary",
        className: "gap-2.5",
      },
      // icon square sizes (all variants)
      { size: "xxs", iconOnly: true, className: "size-6" },
      { size: "xs", iconOnly: true, className: "size-8" },
      { size: "sm", iconOnly: true, className: "size-10" },
      { size: "md", iconOnly: true, className: "size-12" },
      { size: "lg", iconOnly: true, className: "size-14" },
    ],
    defaultVariants: {
      variant: "default",
      size: "xs",
      iconOnly: false,
    },
  },
);

export interface ButtonProps
  extends
    Omit<React.ComponentProps<"button">, "children">,
    Omit<VariantProps<typeof buttonVariants>, "iconOnly"> {
  asChild?: boolean;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
}

function Button({
  className,
  variant = "default",
  size = "xs",
  asChild = false,
  children,
  icon,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  const iconOnly = !asChild && Boolean(!children && icon);

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      className={cn(
        buttonVariants({ variant, size, iconOnly }),
        loading && "animate-pulse",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {asChild ? (
        children
      ) : iconOnly ? (
        icon
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
