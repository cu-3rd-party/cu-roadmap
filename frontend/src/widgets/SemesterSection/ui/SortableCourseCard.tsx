import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";

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
