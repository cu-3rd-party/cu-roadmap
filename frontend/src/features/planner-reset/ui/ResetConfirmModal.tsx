import { useState } from "react";

import { ConfirmModal, Label, Switch } from "@/shared/ui";

interface ResetConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // keepCompleted: keep already-passed courses, reset only the rest
  onConfirm: (keepCompleted: boolean) => void;
  title?: string;
  // show the "keep completed courses" switch — off for a single-semester reset
  showKeepCompleted?: boolean;
}

/* The shared ConfirmModal plus the one control that is specific to a planner
   reset. The switch state lives here so ConfirmModal stays a plain "точно?". */
export const ResetConfirmModal = ({
  open,
  onOpenChange,
  onConfirm,
  title = "Сбросить всё",
  showKeepCompleted = true,
}: ResetConfirmModalProps) => {
  const [keepCompleted, setKeepCompleted] = useState(true);

  const handleConfirm = () => {
    onConfirm(keepCompleted);
    setKeepCompleted(true);
  };

  return (
    <ConfirmModal
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleConfirm}
      title={title}
    >
      {showKeepCompleted && (
        <div className="flex items-center justify-center gap-2">
          <Switch
            id="reset-keep-completed"
            checked={keepCompleted}
            onCheckedChange={setKeepCompleted}
          />
          <Label
            htmlFor="reset-keep-completed"
            className="cursor-pointer text-sm font-normal text-fg-primary"
          >
            Оставить пройденные курсы
          </Label>
        </div>
      )}
    </ConfirmModal>
  );
};
