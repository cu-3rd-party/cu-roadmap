import { memo } from "react";

import { SemesterNumber } from "@/shared/constants";
import { cn } from "@/shared/lib";
import { SelectTile } from "@/shared/ui";
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

// Lightweight, memoized card used inside CourseSelectModal. The tile chrome is
// shared with the admin requisite picker; only the badges and the corner counter
// are planner-specific.
export const CourseSelectCard = memo(
  ({
    course,
    selected,
    selectedSemester,
    disabled,
    onSelect,
  }: CourseSelectCardProps) => (
    <SelectTile
      title={course.title}
      selected={selected}
      disabled={disabled}
      onSelect={() => onSelect(course, selectedSemester)}
      badges={
        <CourseBadges
          variant="select"
          category={course.category}
          type={course.type}
          recommendedSemester={course.recommendedSemester}
          isMobile={false}
          className={cn("mt-auto", selectedSemester !== undefined && "pr-8")}
        />
      }
      corner={
        selectedSemester !== undefined ? (
          <Counter
            variant="primary"
            size="xxs"
            className="absolute right-2 bottom-2"
          >
            {selectedSemester}
          </Counter>
        ) : undefined
      }
    />
  ),
);

CourseSelectCard.displayName = "CourseSelectCard";
