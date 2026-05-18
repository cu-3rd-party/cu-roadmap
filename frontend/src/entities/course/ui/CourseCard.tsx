import { Check, Search } from "lucide-react";
<<<<<<<< HEAD:frontend/src/pages/wizard/ui/CourseCard.tsx
import React, { useState } from "react";

import type { Course } from "@/shared/config";
import { CourseInfoModal } from "@/shared/ui";

import { getCategoryColor } from "../config/category-colors";
========
import { useState } from "react";

import { cn } from "@/shared/lib/cn";

import { getCategoryColor } from "../lib";
import type { Course } from "../model";

import { CourseInfoModal } from "./CourseInfoModal";
>>>>>>>> 36c1c3b (BREAKING CHANGE: switch to shadcn components + react router + react query + fsd decomposition):frontend/src/entities/course/ui/CourseCard.tsx

interface CourseCardProps {
  course: Course;
  isSelected: boolean;
  onToggle: () => void;
  allCourses?: Course[];
  passedIds?: string[];
}

export function CourseCard({
  course,
  isSelected,
  onToggle,
  allCourses = [],
  passedIds = [],
}: CourseCardProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <div
        className={cn(
          "rounded-2xl overflow-hidden cursor-pointer border bg-card transition-all hover:-translate-y-1 hover:shadow-lg select-none",
          isSelected ? "border-2 border-primary" : "border-border",
        )}
        onClick={onToggle}
      >
        <div
          className="h-28 relative"
          style={{
            backgroundColor: course.category
              ? getCategoryColor(course.category)
              : "var(--color-primary)",
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 200 120" opacity="0.4">
            <path
              d="M20 60 Q100 20 180 60"
              stroke="white"
              fill="none"
              strokeWidth="1"
            />
            <path
              d="M20 70 Q100 30 180 70"
              stroke="white"
              fill="none"
              strokeWidth="1"
            />
            <path
              d="M20 80 Q100 40 180 80"
              stroke="white"
              fill="none"
              strokeWidth="1"
            />
          </svg>
          {isSelected && (
            <div className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md bg-primary text-primary-foreground">
              <Check size={16} />
            </div>
          )}
          <button
            type="button"
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform bg-card"
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo(true);
            }}
          >
<<<<<<<< HEAD:frontend/src/pages/wizard/ui/CourseCard.tsx
            <Search size={14} color={"var(--color-primary)"} />
          </div>
========
            <Search size={14} color={getCategoryColor(course.category)} />
          </button>
>>>>>>>> 36c1c3b (BREAKING CHANGE: switch to shadcn components + react router + react query + fsd decomposition):frontend/src/entities/course/ui/CourseCard.tsx
        </div>
        <div className="p-4">
          <div className="font-bold text-base mb-1 leading-snug text-foreground">
            {course.title}
          </div>
<<<<<<<< HEAD:frontend/src/pages/wizard/ui/CourseCard.tsx
          <div
            className="text-xs font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            {course.workload} к.
========
          <div className="text-xs font-medium text-muted-foreground">
            {course.category} • {course.workload} к.
>>>>>>>> 36c1c3b (BREAKING CHANGE: switch to shadcn components + react router + react query + fsd decomposition):frontend/src/entities/course/ui/CourseCard.tsx
          </div>
        </div>
      </div>

      {showInfo && (
        <CourseInfoModal
          course={course}
          allCourses={allCourses}
          passedIds={passedIds}
          onClose={() => setShowInfo(false)}
        />
      )}
    </>
  );
}
