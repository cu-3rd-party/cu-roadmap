import { HelpCircle } from "lucide-react";
import type { ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui";

interface DetailFieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

export const DetailField = ({ label, hint, children }: DetailFieldProps) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1 text-sm text-fg-tertiary">
      {label}
      {hint && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={hint}
                className="text-fg-tertiary transition-colors hover:text-fg-secondary cursor-help"
              >
                <HelpCircle className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{hint}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    {children}
  </div>
);
