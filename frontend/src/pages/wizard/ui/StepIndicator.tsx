import { BookOpen, GraduationCap, Map } from "lucide-react";
import { Fragment } from "react";

import { cn } from "@/shared/lib/cn";

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { icon: BookOpen, label: "1" },
  { icon: GraduationCap, label: "2" },
  { icon: Map, label: "3" },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {steps.map(({ icon: Icon, label }, idx) => {
        const step = idx + 1;
        const isActive = currentStep >= step;
        return (
          <Fragment key={step}>
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Icon size={16} />
              <span className="sr-only">{label}</span>
            </div>
            {step < 3 && (
              <div
                className={cn(
                  "w-16 h-0.5",
                  currentStep > step ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
