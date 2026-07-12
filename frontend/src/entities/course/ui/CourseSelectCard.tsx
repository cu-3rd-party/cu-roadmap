import { memo } from "react";

import { SemesterNumber } from "@/shared/constants";
import { cn } from "@/shared/lib";
import { Counter } from "@/shared/ui/kit";

import type { Course } from "../model/types";

import { CourseBadges } from "./CourseBadges";

interface CourseSelectCardProps {
  course: Course;
  // course is currently placed in some semester (across all semesters)
  selected: boolean;
  // the semester (1-8) this course is placed in, shown as a corner counter
  selectedSemester?: SemesterNumber;
  // card is shown but not actionable here (pinned, or placed in another
  // semester). Renders dimmed + non-clickable.
  disabled: boolean;
  onSelect: (course: Course, selectedSemester?: SemesterNumber) => void;
}

// Lightweight, memoized card used inside CourseSelectModal.
export const CourseSelectCard = memo(
  ({
    course,
    selected,
    selectedSemester,
    disabled,
    onSelect,
  }: CourseSelectCardProps) => (
    <button
      type="button"
      onClick={disabled ? undefined : () => onSelect(course, selectedSemester)}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "relative flex h-full flex-col gap-2 border-2 border-transparent rounded-xl bg-background py-2 px-2 sm:py-4 sm:px-4 text-left transition-colors duration-(--std-duration) ",
        "cursor-pointer hover:bg-accent-pale-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        selected && "border-accent/80",
        disabled && "opacity-60 cursor-default hover:bg-background",
      )}
    >
      <div
        title={course.title}
        className="min-h-[14h] text-sm leading-snug font-medium text-fg-primary"
      >
        {course.title}
      </div>
      <CourseBadges
        variant="select"
        category={course.category}
        type={course.type}
        recommendedSemester={course.recommendedSemester}
        isMobile={false}
        className={cn("mt-auto", selectedSemester !== undefined && "pr-8")}
      />
      {selectedSemester !== undefined && (
        <Counter
          variant="primary"
          size="xxs"
          className="absolute right-2 bottom-2"
        >
          {selectedSemester}
        </Counter>
      )}
    </button>
  ),
);

CourseSelectCard.displayName = "CourseSelectCard";
