import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";

import { CourseCard } from "@/entities/course";
import { cn } from "@/shared/lib";

interface SortableCourseCardProps {
  id: string;
  title: string;
  courseType?: string;
  major?: string;
  moveTargets: number[];
  onRemove: () => void;
  onMove: (toSemester: number) => void;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "touch-none rounded-xl select-none",
        isDragging ? "cursor-grabbing opacity-40" : "cursor-grab",
      )}
    >
      <CourseCard variant="planned" {...cardProps} />
    </div>
  );
};
