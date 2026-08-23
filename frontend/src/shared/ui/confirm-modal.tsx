import { XIcon } from "lucide-react";
import type { ReactNode } from "react";

import { useMediaQuery } from "@/shared/lib";

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./kit";

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  // line under the title; the default warns the action can't be undone
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // extra controls rendered between the description and the buttons
  children?: ReactNode;
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

/* Destructive-confirm dialog: a centered Dialog on desktop, a bottom Sheet on
   touch widths. Everything the app needs to confirm goes through here, so a
   "точно?" always looks and behaves the same. */
export const ConfirmModal = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description = "Это действие необратимо",
  confirmLabel = "Продолжить",
  cancelLabel = "Отменить",
  children,
}: ConfirmModalProps) => {
  const isMobile = useMediaQuery("sm");

  const close = () => onOpenChange(false);

  const handleConfirm = () => {
    onConfirm();
    close();
  };

  const fields = (
    <div className="flex flex-col gap-5">
      <div className="text-fg-secondary">{description}</div>
      {children}

      <div className="flex items-center justify-between">
        <Button variant="tertiaryPadded" size="md" onClick={close}>
          {cancelLabel}
        </Button>
        <Button variant="destructive" size="md" onClick={handleConfirm}>
          {confirmLabel}
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
