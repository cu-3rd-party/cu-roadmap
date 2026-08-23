import type { Course } from "@/entities/course";
import { cn } from "@/shared/lib";
import { Badge } from "@/shared/ui/kit";

import { CATEGORY_FILTER_LABELS } from "../model";

interface AdminCourseBadgesProps {
  course: Course;
  className?: string;
}

/* Mirrors the two filter rows above the grid: год поступления and тип. Same
   Badge primitive and sizing as the planner card's `CourseBadges`, but a course
   currently carries exactly one allowed cohort, so the year is a single badge.
   Orange stays the category colour, matching the planner. */
export const AdminCourseBadges = ({
  course,
  className,
}: AdminCourseBadgesProps) => {
  const cohort = course.allowedCohorts?.[0];

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {cohort !== undefined && (
        <Badge variant="green" size="3xs">
          {cohort}
        </Badge>
      )}
      <Badge variant="orange" size="3xs">
        {CATEGORY_FILTER_LABELS[course.category]}
      </Badge>
    </div>
  );
};
