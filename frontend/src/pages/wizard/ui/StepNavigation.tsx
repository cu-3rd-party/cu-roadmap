import type { ReactNode } from "react";

import { Button } from "@/shared/ui/kit/button";

interface StepNavigationProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextIcon?: ReactNode;
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
        <Button variant="secondary" size="lg" onClick={onBack}>
          Назад
        </Button>
      )}
      <Button
        size="lg"
        onClick={onNext}
        disabled={loading || disabled}
        className="shadow-lg"
      >
        {nextIcon}
        {loading ? "Загрузка..." : nextLabel}
      </Button>
    </div>
  );
}
