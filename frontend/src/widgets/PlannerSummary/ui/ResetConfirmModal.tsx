import { useState } from "react";

import { useMediaQuery } from "@/shared/lib";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
  const isMobile = useMediaQuery("sm");

  const close = () => onOpenChange(false);

  const handleConfirm = () => {
    onConfirm(keepCompleted);
    close();
    setKeepCompleted(true);
  };

  const fields = (
    <>
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
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          aria-describedby={undefined}
          className="gap-0 overflow-hidden rounded-t-3xl bg-negative-pale p-0"
        >
          <SheetHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
            <SheetTitle className="text-2xl font-bold text-fg-primary">
              Сбросить всё
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-5 rounded-t-2xl bg-background p-5">
            {fields}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

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
          {fields}
        </div>
      </DialogContent>
    </Dialog>
  );
};
