import type { ReactNode } from "react";

import { cn } from "@/shared/lib";
import { HintButton } from "@/shared/ui";

export const FilterCard = ({
  label,
  hint,
  className,
  children,
}: {
  label?: string;
  hint?: ReactNode;
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-background p-4",
        className,
      )}
    >
      {label && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-fg-tertiary">{label}</span>
          {hint && <HintButton hint={hint} className="mt-0.5" />}
        </div>
      )}
      {children}
    </div>
  );
};
