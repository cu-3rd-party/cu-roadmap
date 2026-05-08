import React from "react";

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              currentStep >= step ? "text-white" : ""
            }`}
            style={{
              backgroundColor:
                currentStep >= step
                  ? "var(--color-primary)"
                  : "var(--color-bg-hover)",
              color:
                currentStep >= step
                  ? "white"
                  : "var(--color-text-muted)",
            }}
          >
            {step}
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
      ))}
    </div>
  );
}