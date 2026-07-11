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
} from "@/shared/ui";

interface FieldLabelProps {
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
}

const TRIGGER_CLASS =
  "mt-0.5 text-fg-tertiary transition-colors hover:text-fg-secondary cursor-help";

// Match the dark tooltip surface so the mobile popover reads the same as the
// desktop tooltip (PopoverContent defaults to a light elevation).
const HINT_CLASS =
  "w-fit max-w-xs rounded-2xl border-none bg-elevation-03 px-5 py-4 text-xs leading-snug text-fg-primary-on_dark shadow-lg";

// Touch devices have no hover and Radix Tooltip deliberately suppresses on
// touch, so the hint would be unreachable. Use a tap-to-open Popover on mobile
// and the hover Tooltip on desktop, switched by the same breakpoint the modal
// uses for its Dialog/Sheet split.
export const FieldLabel = ({ label, hint, className }: FieldLabelProps) => {
  const isMobile = useMediaQuery("sm");

  const trigger = (
    <button type="button" aria-label="Подробнее" className={TRIGGER_CLASS}>
      <HelpCircle className="size-4" />
    </button>
  );

  return (
    <div
      className={cn(
        "flex items-center gap-2 self-center text-xs sm:text-sm text-fg-secondary",
        className,
      )}
    >
      {label}
      {hint &&
        (isMobile ? (
          <Popover>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent className={HINT_CLASS}>{hint}</PopoverContent>
          </Popover>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>{trigger}</TooltipTrigger>
              <TooltipContent>{hint}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
    </div>
  );
};
