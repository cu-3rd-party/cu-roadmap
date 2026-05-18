import { Info, Trash } from "lucide-react";
import { useState } from "react";

import { CourseInfoModal, type Course } from "@/entities/course";
import { Button } from "@/shared/ui/kit/button";

interface ManualCourseItemProps {
  course: Course;
  allCourses: Course[];
  onRemove: () => void;
}

export function ManualCourseItem({
  course,
  allCourses,
  onRemove,
}: ManualCourseItemProps) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <>
      <div
        className="rounded-xl p-3 flex justify-between items-center group relative cursor-pointer hover:border-primary/50 transition-all border border-border bg-card"
        onClick={() => setShowInfo(true)}
      >
        <div className="flex items-center gap-2 flex-1">
          <strong className="font-semibold text-sm text-foreground">
            {course.title}
          </strong>
          <Info
            size={12}
            className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-destructive opacity-40 hover:opacity-100"
        >
          <Trash />
        </Button>
      </div>
      {showInfo && (
        <CourseInfoModal
          course={course}
          allCourses={allCourses}
          onClose={() => setShowInfo(false)}
        />
      )}
    </>
  );
}
