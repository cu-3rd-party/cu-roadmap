import { XIcon } from "lucide-react";
import { useState } from "react";

import { useMediaQuery } from "@/shared/lib";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Switch,
} from "@/shared/ui";

interface ResetConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // keepCompleted: keep already-passed courses, reset only the rest
  onConfirm: (keepCompleted: boolean) => void;
  title?: string;
  // show the "keep completed courses" switch — off for a single-semester reset
  showKeepCompleted?: boolean;
}

// Gray-circle close button shown in the header (Dialog/Sheet variants share it).
const closeButton = (
  <Button
    variant="ghost"
    size="sm"
    icon={<XIcon />}
    aria-label="Закрыть"
    className="rounded-full bg-accent-pale text-fg-primary hover:bg-accent-pale-hover [&_svg]:size-5"
  />
);

export const ResetConfirmModal = ({
  open,
  onOpenChange,
  onConfirm,
  title = "Сбросить всё",
  showKeepCompleted = true,
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
    <div className="flex flex-col gap-5">
      <div className="text-fg-secondary">Это действие необратимо</div>
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

      <div className="flex items-center justify-between">
        <Button variant="tertiaryPadded" size="md" onClick={close}>
          Отменить
        </Button>
        <Button variant="destructive" size="md" onClick={handleConfirm}>
          Продолжить
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          swipeToClose
          showCloseButton={false}
          aria-describedby={undefined}
          className="gap-3 overflow-hidden rounded-t-3xl bg-background p-6"
        >
          <SheetHeader className="flex-row items-center justify-between gap-4 p-0">
            <SheetTitle className="text-xl font-bold text-fg-primary">
              {title}
            </SheetTitle>
            <SheetClose asChild>{closeButton}</SheetClose>
          </SheetHeader>
          {fields}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="flex w-[calc(100%-2rem)] flex-col gap-3 overflow-hidden rounded-3xl bg-background p-6 sm:max-w-lg"
      >
        <DialogHeader className="flex-row items-center justify-between gap-4">
          <DialogTitle className="text-2xl font-bold text-fg-primary">
            {title}
          </DialogTitle>
          <DialogClose asChild>{closeButton}</DialogClose>
        </DialogHeader>
        {fields}
      </DialogContent>
    </Dialog>
  );
};
