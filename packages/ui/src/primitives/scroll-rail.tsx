import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { cn } from "../lib/cn";
import { Button } from "../kit/button";

interface ScrollRailProps {
  children: React.ReactNode;
  className?: string;
  viewportClassName?: string;
}

// Horizontal rail: keeps its children on a single row that overflows and
// scrolls instead of wrapping. Adds mouse drag-to-scroll and </> edge buttons
// that appear only while there is room to scroll in that direction.
export const ScrollRail = ({
  children,
  className,
  viewportClassName,
}: ScrollRailProps) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const left = el.scrollLeft > 1;
    const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
    setCanLeft((prev) => (prev === left ? prev : left));
    setCanRight((prev) => (prev === right ? prev : right));
  }, []);

  // Recompute after every render: the content width can change without the
  // viewport resizing (e.g. when the sub-options list changes). update() is a
  // no-op when nothing changed, so this can't loop.
  useLayoutEffect(update);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  // Mouse drag-to-scroll. Touch keeps native momentum scrolling.
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = viewportRef.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startLeft: el.scrollLeft,
      moved: false,
    };
    // Do NOT capture the pointer here: capturing on pointerdown makes the
    // browser dispatch the follow-up click to this container instead of the
    // chip, which makes the chips unclickable. Capture only once an actual
    // drag begins (see onPointerMove).
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const el = viewportRef.current;
    if (!el) return;
    const dx = e.clientX - drag.current.startX;
    if (!drag.current.moved && Math.abs(dx) > 5) {
      drag.current.moved = true;
      el.setPointerCapture(e.pointerId);
    }
    if (drag.current.moved) {
      el.scrollLeft = drag.current.startLeft - dx;
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const el = viewportRef.current;
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
  };

  // Swallow the click that follows a drag so it doesn't toggle the chip under
  // the cursor. A plain click (no movement) passes through untouched.
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drag.current.moved) {
      e.stopPropagation();
      e.preventDefault();
      drag.current.moved = false;
    }
  };

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence>
        {canLeft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center"
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-linear-to-r from-background to-transparent" />
            <Button
              type="button"
              variant="ghost"
              size="xs"
              icon={<ChevronLeft className="size-4" />}
              aria-label="Прокрутить влево"
              onClick={() => scrollByPage(-1)}
              className="pointer-events-auto relative ml-0.5 rounded-full bg-accent text-accent-opposite shadow-sm hover:bg-accent/90 hover:text-accent-opposite"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={viewportRef}
        onScroll={update}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        className={cn(
          "flex gap-2 overflow-x-auto overscroll-x-contain",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          (canLeft || canRight) && "cursor-grab active:cursor-grabbing",
          viewportClassName,
        )}
      >
        {children}
      </div>

      <AnimatePresence>
        {canRight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center justify-end"
          >
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
            <Button
              type="button"
              variant="ghost"
              size="xs"
              icon={<ChevronRight className="size-4" />}
              aria-label="Прокрутить вправо"
              onClick={() => scrollByPage(1)}
              className="pointer-events-auto relative mr-0.5 rounded-full bg-accent text-accent-opposite shadow-sm hover:bg-accent/90 hover:text-accent-opposite"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
