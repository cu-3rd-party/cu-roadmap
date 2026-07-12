import type { ReactNode } from "react";

import { HintButton } from "@/shared/ui";

interface DetailFieldProps {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}

export const DetailField = ({ label, hint, children }: DetailFieldProps) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1 text-sm text-fg-tertiary">
      {label}
      {hint && <HintButton hint={hint} />}
    </div>
    {children}
  </div>
);
