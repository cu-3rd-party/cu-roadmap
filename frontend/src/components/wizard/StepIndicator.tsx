import { BookOpen, ChevronRight, Route, Settings } from "lucide-react";
import React from "react";

const steps = [
  { id: 1, title: "Курсы", desc: "Что вы уже изучали", icon: BookOpen },
  {
    id: 2,
    title: "Настройка",
    desc: "Специальность и семестр",
    icon: Settings,
  },
  { id: 3, title: "Траектория", desc: "Ваш план обучения", icon: Route },
];

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, idx) => {
        const isActive = currentStep >= step.id;
        const isCurrent = currentStep === step.id;
        const Icon = step.icon;
        return (
          <React.Fragment key={step.id}>
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
              style={
                isActive
                  ? { backgroundColor: "var(--color-primary)", color: "white" }
                  : {
                      backgroundColor: "var(--color-bg-hover)",
                      color: "var(--color-text-muted)",
                    }
              }
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor:
                    isCurrent || isActive
                      ? "rgba(255,255,255,0.2)"
                      : "var(--color-bg-main)",
                }}
              >
                <Icon size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">{step.title}</span>
                <span
                  className="text-xs"
                  style={
                    isActive
                      ? { color: "rgba(255,255,255,0.7)" }
                      : { color: "var(--color-text-muted)" }
                  }
                >
                  {step.desc}
                </span>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight
                size={20}
                style={{
                  color: isActive
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
