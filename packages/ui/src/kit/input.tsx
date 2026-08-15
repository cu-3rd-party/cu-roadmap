import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/cn";

const wrapperVariants = cva(
  [
    "flex items-center w-full min-w-0 cursor-text",
    "border bg-background",
    "border-border",
    "transition-colors duration-(--std-duration)",
    "[&:hover:not(:focus-within)]:border-border-hover [&:hover:not(:focus-within)]:bg-accent-pale-hover",
    "focus-within:border-border-pressed focus-within:bg-accent-pale-hover",
    "has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-10 rounded-[8px]  gap-2 px-3",
        md: "h-12 rounded-[12px] gap-2 px-[14px]",
        lg: "h-14 rounded-[12px] gap-2 px-4",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const inputClass = [
  "flex-1 min-w-0 bg-transparent outline-none",
  "text-fg-primary placeholder:text-fg-tertiary",
  "text-sm",
  "disabled:cursor-not-allowed",
].join(" ");

export interface InputProps
  extends
    Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof wrapperVariants> {
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

function Input({
  className,
  wrapperClassName,
  size = "md",
  icon,
  type,
  ...props
}: InputProps) {
  return (
    <label className={cn(wrapperVariants({ size }), wrapperClassName)}>
      {icon && (
        <span className="shrink-0 text-fg-tertiary [&_svg]:size-4">{icon}</span>
      )}
      <input
        type={type}
        data-slot="input"
        className={cn(inputClass, className)}
        {...props}
      />
    </label>
  );
}

export { Input };
