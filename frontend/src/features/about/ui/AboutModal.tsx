import { useMediaQuery } from "@/shared/lib";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui";

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AboutModal = ({ open, onOpenChange }: AboutModalProps) => {
  const isMobile = useMediaQuery("sm");

  const content = (
    <p className="text-sm text-fg-primary">
      Возможны неточности при заполнении курсов, траектории могут меняться,
      поэтому перепроверяйте важную информацию.
      <br />
      <br />
      Если вы нашли ошибку и хотите о ней сообщить,{" "}
      <a
        href="https://forms.gle/jMbeQvE64YB8KP1c9"
        target="_blank"
        rel="noopener noreferrer"
        className="text-fg-sure-blue underline"
      >
        заполните форму
      </a>
      .
    </p>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="gap-0 overflow-hidden rounded-t-3xl bg-sure-blue-pale p-0"
          swipeToClose
        >
          <SheetHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
            <SheetTitle className="text-2xl font-bold text-fg-primary">
              О проекте
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 rounded-t-2xl bg-background p-5">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[calc(100%-2rem)] min-w-xl flex-col gap-0 overflow-hidden rounded-3xl bg-sure-blue-pale p-0">
        <DialogHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
          <DialogTitle className="text-2xl font-bold text-fg-primary">
            О проекте
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 rounded-2xl bg-background p-5">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};
