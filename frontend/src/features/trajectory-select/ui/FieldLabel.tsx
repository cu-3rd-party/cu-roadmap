import type { ReactNode } from "react";

import { cn } from "@/shared/lib";
import { HintButton } from "@/shared/ui";

interface FieldLabelProps {
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
}

export const FieldLabel = ({ label, hint, className }: FieldLabelProps) => (
  <div
    className={cn(
      "flex items-center gap-2 self-center text-xs sm:text-sm text-fg-secondary",
      className,
    )}
  >
    {label}
    {hint && <HintButton hint={hint} className="mt-0.5" />}
  </div>
);
