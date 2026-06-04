import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

import { CourseCard, type CourseDetails } from "@/entities/course";
import { cn } from "@/shared/lib";
import { CourseCategory, CourseType } from "@/shared/model";

interface SortableCourseCardProps {
  id: string;
  title: string;
  category?: CourseCategory;
  type?: CourseType;
  moveTargets: number[];
  conflict?: boolean;
  generated?: boolean;
  onRemove: () => void;
  onMove: (toSemester: number) => void;
  details?: CourseDetails;
}

export const SortableCourseCard = ({
  id,
  ...cardProps
}: SortableCourseCardProps) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // The course details drawer is portaled to <body> but is a React child of
  // this draggable, so React events from inside it bubble here. Don't start a
  // drag when the pointerdown originates in the drawer -  but let the event keep
  // propagating so the drawer's own handlers still work.
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest(
        '[data-slot="sheet-content"], [data-slot="sheet-overlay"]',
      )
    ) {
      return;
    }
    listeners?.onPointerDown?.(e);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={handlePointerDown}
      className={cn(
        "touch-none rounded-xl select-none",
        isDragging ? "cursor-grabbing opacity-40" : "cursor-grab",
      )}
    >
      <CourseCard variant="planned" {...cardProps} />
    </div>
  );
};
