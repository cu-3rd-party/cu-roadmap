import type { ReactNode } from "react";

import { cn } from "@/shared/lib";

interface SelectTileProps {
  title: string;
  /* Badge row, pushed to the bottom of the tile by the caller's `mt-auto`. */
  badges?: ReactNode;
  /* Absolutely positioned bottom-right slot — the planner puts its semester
     Counter here; the admin picker has no corner marker. */
  corner?: ReactNode;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  className?: string;
}

/* The selectable card shared by the planner's course picker and the admin
   requisite picker. Domain-free on purpose: everything specific to what is being
   picked arrives through `badges` / `corner`. */
export const SelectTile = ({
  title,
  badges,
  corner,
  selected,
  disabled = false,
  onSelect,
  className,
}: SelectTileProps) => (
  <button
    type="button"
    onClick={disabled ? undefined : onSelect}
    disabled={disabled}
    aria-pressed={selected}
    className={cn(
      "relative flex h-full flex-col gap-2 border-2 border-transparent rounded-xl bg-background py-2 px-2 sm:py-4 sm:px-4 text-left transition-colors duration-(--std-duration) ",
      "cursor-pointer hover:bg-accent-pale-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
      selected && "border-accent/80",
      disabled && "opacity-60 cursor-default hover:bg-background",
      className,
    )}
  >
    <div
      title={title}
      className="min-h-[14h] text-sm leading-snug font-medium text-fg-primary"
    >
      {title}
    </div>
    {badges}
    {corner}
  </button>
);
