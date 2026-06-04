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
      className={cn("rounded-2xl bg-background p-4 sm:p-6 sm:pt-8", className)}
      {...props}
    />
  );
}

interface CollapsiblePanelProps extends Omit<
  React.ComponentProps<"div">,
  "title"
> {
  title: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsiblePanel({
  title,
  defaultOpen = true,
  className,
  children,
  ...props
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      data-slot="collapsible-panel"
      data-state={open ? "open" : "closed"}
      className={cn("overflow-hidden rounded-xl bg-background-alt", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-2 px-5 py-3">
        <span className="text-sm font-semibold text-fg-primary">{title}</span>
        <Button
          variant="ghost"
          size="sm"
          icon={
            <ChevronUp
              className={cn("transition-transform", !open && "rotate-180")}
            />
          }
          aria-label={open ? "Свернуть" : "Развернуть"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        />
      </div>
      <AnimatePresence initial={false}>
        {open && (
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
