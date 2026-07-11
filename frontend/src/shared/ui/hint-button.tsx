import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";

import { cn, useMediaQuery } from "@/shared/lib";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/kit";

interface HintButtonProps {
  hint: ReactNode;
  className?: string;
}

// Match the dark tooltip surface so the mobile popover reads the same as the
// desktop tooltip (PopoverContent defaults to a light elevation).
const HINT_CLASS =
  "w-fit max-w-xs rounded-2xl border-none bg-elevation-03 px-5 py-4 text-xs leading-snug text-fg-primary-on_dark shadow-lg";

// Small "?" help trigger. Touch devices have no hover and Radix Tooltip
// deliberately suppresses on touch, so the hint would be unreachable — use a
// tap-to-open Popover on mobile and the hover Tooltip on desktop, switched by
// the same breakpoint the modals use for their Dialog/Sheet split.
export const HintButton = ({ hint, className }: HintButtonProps) => {
  const isMobile = useMediaQuery("sm");

  const trigger = (
    <button
      type="button"
      aria-label="Подробнее"
      className={cn(
        "text-fg-tertiary transition-colors hover:text-fg-secondary cursor-help",
        className,
      )}
    >
      <HelpCircle className="size-4" />
    </button>
  );

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className={HINT_CLASS}>{hint}</PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent>{hint}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
