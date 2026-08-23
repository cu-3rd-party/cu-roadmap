import { Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { cn, useMediaQuery } from "@/shared/lib";
import { CardSkeleton } from "@/shared/ui/card-skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/kit";
import { RevealImage } from "@/shared/ui/reveal-image";

const DEFAULT_GRID = "grid gap-1 grid-cols-2 lg:grid-cols-5";

interface SelectGridModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /* Desktop title, and the mobile default. */
  title: ReactNode;
  /* Mobile-only override — the planner adds a "(N семестр)" second line. */
  mobileTitle?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  /* Search / filter / segmented controls, inside the white card above the grid. */
  controls?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  errorText?: string;
  isEmpty?: boolean;
  emptyText?: string;
  gridClassName?: string;
  children: ReactNode;
}

/* Chrome shared by the planner's course picker and the admin requisite picker:
   the Dialog/Sheet split, the header art, and the loading/error/empty states of
   the scrolling grid. Deliberately domain-free — what gets picked is the
   caller's business. */
export const SelectGridModal = ({
  open,
  onOpenChange,
  title,
  mobileTitle,
  imageSrc,
  imageAlt = "",
  controls,
  isLoading = false,
  isError = false,
  errorText = "Не удалось загрузить курсы. Попробуйте обновить страницу.",
  isEmpty = false,
  emptyText = "Ничего не найдено.",
  gridClassName = DEFAULT_GRID,
  children,
}: SelectGridModalProps) => {
  const isMobile = useMediaQuery("sm");

  // ATTENTION
  // On mobile the Sheet's 0.5s slide stutters when all cards mount in the same
  // commit, so defer the (heavy) grid until the entrance settles. Desktop's
  // Dialog opens fine, so it renders the cards immediately.
  const [listReady, setListReady] = useState(false);
  useEffect(() => {
    if (!isMobile) {
      setListReady(true);
      return;
    }
    if (!open) {
      setListReady(false);
      return;
    }
    const t = setTimeout(() => setListReady(true), 520); // slightly > Sheet 500ms
    return () => clearTimeout(t);
  }, [open, isMobile]);

  const content = (
    <>
      <div className="relative z-10 shrink-0 px-3 pb-1">
        <div className="flex flex-col gap-3 rounded-2xl bg-background p-4">
          {controls}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-expert-blue-pale pl-4 pr-3 pb-3 scrollbar-gutter-stable">
        {isLoading || !listReady ? (
          isMobile ? (
            <div className="flex w-full items-center justify-center py-16">
              <Loader2
                className="size-8 animate-spin text-fg-secondary"
                aria-label="Загрузка…"
              />
            </div>
          ) : (
            <div className={gridClassName}>
              {Array.from({ length: 10 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          )
        ) : isError ? (
          <p className="px-1 py-4 text-sm text-fg-negative">{errorText}</p>
        ) : isEmpty ? (
          <div className="flex w-full items-center justify-center rounded-2xl bg-background px-4 py-10 text-sm text-fg-secondary">
            {emptyText}
          </div>
        ) : (
          <div className={cn(gridClassName)}>{children}</div>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          swipeToClose
          dragHandleOnly
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="flex h-[90vh] flex-col gap-0 overflow-hidden rounded-t-3xl bg-expert-blue-pale p-0"
        >
          <SheetHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
            <SheetTitle className="text-2xl font-bold text-fg-primary">
              {mobileTitle ?? title}
            </SheetTitle>
            {imageSrc && (
              <RevealImage
                src={imageSrc}
                alt={imageAlt}
                aria-hidden
                className="pointer-events-none absolute top-6 right-6 h-24 w-auto select-none object-contain"
              />
            )}
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex h-[42rem] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-3xl bg-expert-blue-pale p-0 max-w-xl sm:max-w-2xl lg:max-w-5xl xl:max-w-7xl"
      >
        <DialogHeader className="relative shrink-0 px-8 pt-7 pb-4 overflow-hidden">
          <DialogTitle className="text-2xl font-bold text-fg-primary">
            {title}
          </DialogTitle>
          {imageSrc && (
            <RevealImage
              src={imageSrc}
              alt={imageAlt}
              aria-hidden
              className="pointer-events-none absolute top-1 right-16 h-32 w-auto select-none object-contain"
            />
          )}
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
