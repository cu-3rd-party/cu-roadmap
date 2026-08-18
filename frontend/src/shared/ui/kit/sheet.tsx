"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  AnimatePresence,
  motion,
  type PanInfo,
  type Transition,
  useDragControls,
} from "framer-motion";
import { XIcon } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/kit/button";

interface SheetContextValue {
  open: boolean;
  requestClose: () => void;
}

const SheetContext = React.createContext<SheetContextValue>({
  open: false,
  requestClose: () => {},
});

// Lets a header/grabber inside SheetContent initiate the close drag when the
// sheet is in "handle-only" mode (body scrolls, only the handle drags).
const SheetHandleContext = React.createContext<{
  startDrag?: (e: React.PointerEvent) => void;
}>({});

function Sheet({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false,
  );
  const isControlled = open !== undefined;
  const resolvedOpen = isControlled ? open : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const contextValue = React.useMemo<SheetContextValue>(
    () => ({ open: resolvedOpen, requestClose: () => handleOpenChange(false) }),
    [resolvedOpen, handleOpenChange],
  );

  return (
    <SheetContext.Provider value={contextValue}>
      <SheetPrimitive.Root
        data-slot="sheet"
        open={resolvedOpen}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </SheetContext.Provider>
  );
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

const sheetVariants = cva(
  "fixed z-50 flex flex-col gap-4 bg-popover text-popover-foreground shadow-lg outline-none",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 h-auto",
        bottom: "inset-x-0 bottom-0 h-auto",
        left: "inset-y-0 left-0 h-full w-full max-w-xl",
        right: "inset-y-0 right-0 h-full w-full max-w-xl",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

type Side = NonNullable<VariantProps<typeof sheetVariants>["side"]>;

const SHEET_OFFSCREEN: Record<Side, { x?: string; y?: string }> = {
  top: { y: "-100%" },
  bottom: { y: "100%" },
  left: { x: "-100%" },
  right: { x: "100%" },
};

const SHEET_TRANSITION: Transition = {
  type: "tween",
  duration: 0.5,
  ease: [0.16, 1, 0.3, 1],
};

// Swipe-to-dismiss tuning, per side: which axis to drag, the elastic give
// (only in the dismiss direction so wrong-way drags resist), and whether a
// drag release should close the sheet.
const SWIPE_OFFSET = 120;
const SWIPE_VELOCITY = 500;

const SWIPE_CONFIG: Record<
  Side,
  {
    axis: "x" | "y";
    elastic: { top: number; bottom: number; left: number; right: number };
    shouldClose: (info: PanInfo) => boolean;
  }
> = {
  right: {
    axis: "x",
    elastic: { top: 0, bottom: 0, left: 0, right: 0.8 },
    shouldClose: ({ offset, velocity }) =>
      offset.x > SWIPE_OFFSET || velocity.x > SWIPE_VELOCITY,
  },
  left: {
    axis: "x",
    elastic: { top: 0, bottom: 0, left: 0.8, right: 0 },
    shouldClose: ({ offset, velocity }) =>
      offset.x < -SWIPE_OFFSET || velocity.x < -SWIPE_VELOCITY,
  },
  bottom: {
    axis: "y",
    elastic: { top: 0, bottom: 0.8, left: 0, right: 0 },
    shouldClose: ({ offset, velocity }) =>
      offset.y > SWIPE_OFFSET || velocity.y > SWIPE_VELOCITY,
  },
  top: {
    axis: "y",
    elastic: { top: 0.8, bottom: 0, left: 0, right: 0 },
    shouldClose: ({ offset, velocity }) =>
      offset.y < -SWIPE_OFFSET || velocity.y < -SWIPE_VELOCITY,
  },
};

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  swipeToClose = false,
  dragHandleOnly = false,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants> & {
    showCloseButton?: boolean;
    swipeToClose?: boolean;
    dragHandleOnly?: boolean;
  }) {
  const { open, requestClose } = React.useContext(SheetContext);
  const resolvedSide = side ?? "right";
  const offscreen = SHEET_OFFSCREEN[resolvedSide];
  const swipe = SWIPE_CONFIG[resolvedSide];
  const dragControls = useDragControls();
  const showGrabber =
    swipeToClose && (resolvedSide === "bottom" || resolvedSide === "top");
  const startDrag =
    swipeToClose && dragHandleOnly
      ? (e: React.PointerEvent) => dragControls.start(e)
      : undefined;

  return (
    <AnimatePresence>
      {open && (
        <SheetPortal forceMount>
          <SheetPrimitive.Overlay data-slot="sheet-overlay" asChild forceMount>
            <motion.div
              // transform-gpu keeps the overlay on its own GPU layer even after
              // the opacity fade ends, so the heavy page behind it is rasterized
              // once instead of being repainted on every frame of the panel slide.
              className="fixed inset-0 z-50 transform-gpu bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </SheetPrimitive.Overlay>
          <SheetPrimitive.Content
            data-slot="sheet-content"
            asChild
            forceMount
            {...props}
          >
            <motion.div
              // Keep the sliding panel on its own GPU layer so the slide only
              // composites this layer instead of repainting the panel (and the
              // page behind the translucent overlay) every frame. The single
              // biggest factor for smoothness on low-end mobile.
              style={{ willChange: "transform", backfaceVisibility: "hidden" }}
              className={cn(sheetVariants({ side }), className)}
              initial={offscreen}
              animate={{ x: 0, y: 0 }}
              exit={offscreen}
              transition={SHEET_TRANSITION}
              {...(swipeToClose && {
                drag: swipe.axis,
                dragConstraints: { top: 0, bottom: 0, left: 0, right: 0 },
                dragElastic: swipe.elastic,
                dragDirectionLock: true,
                onDragEnd: (_e, info: PanInfo) => {
                  if (swipe.shouldClose(info)) requestClose();
                },
                ...(dragHandleOnly && {
                  dragListener: false,
                  dragControls,
                }),
              })}
            >
              {showGrabber && (
                <div
                  aria-hidden
                  onPointerDown={startDrag}
                  className={cn(
                    "absolute top-1 left-1/2 z-10 -translate-x-1/2 px-8 py-2",
                    startDrag && "cursor-grab touch-none",
                  )}
                >
                  <div className="h-1 w-8 rounded-full bg-fg-tertiary/40" />
                </div>
              )}
              <SheetHandleContext.Provider value={{ startDrag }}>
                {children}
              </SheetHandleContext.Provider>
              {showCloseButton && (
                <SheetPrimitive.Close data-slot="sheet-close" asChild>
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={<XIcon />}
                    aria-label="Close"
                    className="absolute top-4 right-4"
                  />
                </SheetPrimitive.Close>
              )}
            </motion.div>
          </SheetPrimitive.Content>
        </SheetPortal>
      )}
    </AnimatePresence>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  const { startDrag } = React.useContext(SheetHandleContext);
  return (
    <div
      data-slot="sheet-header"
      onPointerDown={startDrag}
      className={cn(
        "flex flex-col gap-1.5 p-4",
        startDrag && "cursor-grab touch-none select-none",
        className,
      )}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-base leading-none font-medium", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
