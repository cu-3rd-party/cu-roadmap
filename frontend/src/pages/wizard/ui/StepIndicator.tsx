import { BookOpen, GraduationCap, Map } from "lucide-react";
import React from "react";

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
      {steps.map(({ icon: Icon }, idx) => {
        const step = idx + 1;
        const isActive = currentStep >= step;
        return (
          <React.Fragment key={step}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
              style={{
                backgroundColor: isActive
                  ? "var(--color-primary)"
                  : "var(--color-bg-hover)",
                color: isActive ? "white" : "var(--color-text-muted)",
              }}
            >
              <Icon size={16} />
            </div>
            {step < 3 && (
              <div
                className="w-16 h-0.5"
                style={{
                  backgroundColor:
                    currentStep > step
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
