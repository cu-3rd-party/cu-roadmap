import React from "react";

interface StepNavigationProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextIcon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

export function StepNavigation({
  onBack,
  onNext,
  nextLabel = "Далее",
  nextIcon,
  loading,
  disabled,
}: StepNavigationProps) {
  return (
    <div className="flex justify-center gap-4 mt-6">
      {onBack && (
        <button
          onClick={onBack}
          className="border-none px-5 py-3 rounded-xl font-bold text-sm cursor-pointer transition-colors"
          style={{
            backgroundColor: "var(--color-bg-hover)",
            color: "var(--color-text-main)",
          }}
        >
          Назад
        </button>
      )}
      <button
        onClick={onNext}
        disabled={loading || disabled}
        className="flex items-center gap-2 text-white border-none px-6 py-3 rounded-xl font-bold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {nextIcon}
        {loading ? "Загрузка..." : nextLabel}
      </button>
    </div>
  );
}
