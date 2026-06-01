"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import { XIcon } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/kit/button";

const SheetOpenContext = React.createContext(false);

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

  return (
    <SheetOpenContext.Provider value={resolvedOpen}>
      <SheetPrimitive.Root
        data-slot="sheet"
        open={resolvedOpen}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </SheetOpenContext.Provider>
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

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants> & {
    showCloseButton?: boolean;
  }) {
  const open = React.useContext(SheetOpenContext);
  const offscreen = SHEET_OFFSCREEN[side ?? "right"];

  return (
    <AnimatePresence>
      {open && (
        <SheetPortal forceMount>
          <SheetPrimitive.Overlay data-slot="sheet-overlay" asChild forceMount>
            <motion.div
              className="fixed inset-0 z-50 bg-black/50"
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
              className={cn(sheetVariants({ side }), className)}
              initial={offscreen}
              animate={{ x: 0, y: 0 }}
              exit={offscreen}
              transition={SHEET_TRANSITION}
            >
              {children}
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
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
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
