import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp } from "lucide-react";
import * as React from "react";
import { useState } from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/kit/button";

function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="panel"
      className={cn("rounded-2xl bg-background p-4 sm:p-6", className)}
      {...props}
    />
  );
}

interface CollapsiblePanelProps extends Omit<
  React.ComponentProps<"div">,
  "title" | "onClick"
> {
  title: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  rowClickable?: boolean;
  extraPadded?: boolean;
}

function CollapsiblePanel({
  title,
  defaultOpen = true,
  open,
  onOpenChange,
  rowClickable = true,
  extraPadded = true,
  className,
  children,

  ...props
}: CollapsiblePanelProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? open : internalOpen;

  const toggle = () => {
    const next = !isOpen;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div
      data-slot="collapsible-panel"
      data-state={isOpen ? "open" : "closed"}
      className={cn("overflow-hidden rounded-xl bg-background-alt", className)}
      {...props}
    >
      {rowClickable ? (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          className="flex w-full cursor-pointer items-center justify-between gap-2 px-5 py-3 text-left"
        >
          <span className="text-sm font-semibold text-fg-primary">{title}</span>
          {extraPadded ? (
            <div className="size-10 flex items-center justify-center">
              <ChevronUp
                className={cn(
                  "shrink-0 transition-transform",
                  !isOpen && "rotate-180",
                )}
              />
            </div>
          ) : (
            <ChevronUp
              className={cn(
                "shrink-0 transition-transform",
                !isOpen && "rotate-180",
              )}
            />
          )}
        </button>
      ) : (
        <div className="flex items-center justify-between gap-2 px-5 py-3">
          <span className="text-sm font-semibold text-fg-primary">{title}</span>
          <Button
            variant="ghost"
            size="sm"
            icon={
              <ChevronUp
                className={cn("transition-transform", !isOpen && "rotate-180")}
              />
            }
            aria-label={isOpen ? "Свернуть" : "Развернуть"}
            aria-expanded={isOpen}
            onClick={toggle}
          />
        </div>
      )}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-1 pb-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { Panel, CollapsiblePanel };
