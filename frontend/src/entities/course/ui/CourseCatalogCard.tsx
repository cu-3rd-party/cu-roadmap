import { Ellipsis, Plus } from "lucide-react";
import { memo } from "react";

import { SemesterNumber } from "@/shared/constants";
import { cn } from "@/shared/lib";
import {
  Counter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/kit";

import type { Course } from "../model/types";

import { CourseBadges } from "./CourseBadges";

interface CourseCatalogCardProps {
  course: Course;
  // the semester (1-8) this course is currently placed in, if any. Selection is
  // tracked across all semesters; undefined means the course isn't placed.
  selectedSemester?: SemesterNumber;
  // open the shared details drawer for this course
  onOpenDetails: (courseId: Course["id"]) => void;
  // add (course not yet placed) or move (already placed) into `toSemester`
  onMove: (
    course: Course,
    toSemester: number,
    selectedSemester?: SemesterNumber,
  ) => void;
  // remove the course from its current semester
  onRemove: (course: Course, selectedSemester: SemesterNumber) => void;
}

// Memoized, fully prop-driven catalog card.
export const CourseCatalogCard = memo(
  ({
    course,
    selectedSemester,
    onOpenDetails,
    onMove,
    onRemove,
  }: CourseCatalogCardProps) => {
    const isSelected = selectedSemester !== undefined;
    const fixed = (course.fixedSemester ?? 0) >= 1;
    // add: any semester the course is offered in. move: same, minus current.
    const menuTargets = isSelected
      ? course.availableSemesters.filter((n) => n !== selectedSemester)
      : course.availableSemesters;
    // selected courses always get a menu (delete is always available); unselected
    // ones only when there's at least one semester to add to. fixed = no menu.
    const showMenu = !fixed && (isSelected || menuTargets.length > 0);

    return (
      // perf optimization
      <div className="relative h-full [content-visibility:auto] [contain-intrinsic-size:auto_7rem]">
        <button
          type="button"
          onClick={() => onOpenDetails(course.id)}
          className={cn(
            "relative flex h-full w-full flex-col gap-2 border-2 border-transparent rounded-xl bg-background py-4 px-2 sm:px-4 text-left transition-colors duration-(--std-duration) cursor-pointer",
            "hover:bg-accent-pale-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            isSelected && "border-accent/80",
          )}
        >
          <div
            title={course.title}
            className={cn(
              "min-h-[2lh] text-sm leading-snug font-medium text-fg-primary",
              showMenu && "pr-6",
            )}
          >
            {course.title}
          </div>
          <CourseBadges
            variant="catalog"
            category={course.category}
            type={course.type}
            recommendedSemester={course.recommendedSemester}
            isMobile={false}
            className={cn("mt-auto", isSelected && "pr-8")}
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

        {showMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={
                isSelected ? "Действия с курсом" : "Добавить в семестр"
              }
              className="absolute top-1 sm:top-3 right-1 grid size-6 cursor-pointer place-items-center rounded-md text-fg-secondary transition-colors duration-(--std-duration) hover:bg-accent-pale-hover hover:text-fg-primary focus-visible:ring-0 focus-visible:outline-none"
            >
              {isSelected ? (
                <Ellipsis className="size-4" aria-hidden />
              ) : (
                <Plus className="size-4" aria-hidden />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {menuTargets.map((n) => (
                <DropdownMenuItem
                  key={n}
                  onSelect={() => onMove(course, n, selectedSemester)}
                >
                  {n} семестр
                </DropdownMenuItem>
              ))}
              {isSelected && menuTargets.length > 0 && (
                <DropdownMenuSeparator />
              )}
              {isSelected && (
                <DropdownMenuItem
                  className="text-negative"
                  onSelect={() => onRemove(course, selectedSemester)}
                >
                  Удалить
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  },
);

CourseCatalogCard.displayName = "CourseCatalogCard";
