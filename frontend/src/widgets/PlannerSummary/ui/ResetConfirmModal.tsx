import { useState } from "react";

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
} from "@/shared/ui";

interface ResetConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // keepCompleted: keep already-passed courses, reset only the rest
  onConfirm: (keepCompleted: boolean) => void;
}

export const ResetConfirmModal = ({
  open,
  onOpenChange,
  onConfirm,
}: ResetConfirmModalProps) => {
  const [keepCompleted, setKeepCompleted] = useState(true);

  const close = () => onOpenChange(false);

  const handleConfirm = () => {
    onConfirm(keepCompleted);
    close();
    setKeepCompleted(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-3xl bg-negative-pale p-0 sm:max-w-md"
      >
        <DialogHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
          <DialogTitle className="text-2xl font-bold text-fg-primary">
            Сбросить всё
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 rounded-2xl bg-background p-5">
          <div className="flex items-center justify-center gap-2">
            <Checkbox
              id="reset-keep-completed"
              checked={keepCompleted}
              onCheckedChange={(checked) => setKeepCompleted(checked === true)}
            />
            <Label
              htmlFor="reset-keep-completed"
              className="cursor-pointer text-sm font-normal text-fg-primary"
            >
              Оставить пройденные курсы
            </Label>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="tertiaryPadded" size="md" onClick={close}>
              Отменить
            </Button>
            <Button variant="destructive" size="md" onClick={handleConfirm}>
              Продолжить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
