import { ArrowRightLeft, Info, Trash2 } from "lucide-react";

import { cn, useMediaQuery } from "@/shared/lib";
import { CourseCategory, CourseType, type UUID } from "@/shared/model";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
} from "@/shared/ui/kit";

import { useCourseDrawerStore } from "../model";

import { CourseBadges } from "./CourseBadges";

// "catalog" lives in CourseCatalogCard and "select" in CourseSelectCard; this
// component now only renders the "planned" card (inside a semester block).
export type CourseCardVariant = "catalog" | "select" | "planned";

interface CourseCardProps {
  // course id used to open the shared details drawer
  courseId?: UUID;
  title: string;
  variant?: CourseCardVariant;
  // course-category badge label (orange), e.g. "Fundamentals", "Major Core"
  category?: CourseCategory;
  // major badge label (blue), e.g. "SE", "Business", "AI"
  type?: CourseType;
  // "move to" targets for the card menu (already excludes the current semester)
  moveTargets?: number[];
  // renders a negative ring when the course has a validation conflict
  conflict?: boolean;
  // blue highlight for courses just added by the generate algorithm.
  // A conflict (red) takes precedence over this.
  generated?: boolean;
  // course is pinned to its semester: move/delete are disabled. Drag-reordering
  // stays allowed (lives on the wrapper).
  fixed?: boolean;
  onRemove?: () => void;
  onMove?: (toSemester: number) => void;
}

export const CourseCard = ({
  courseId,
  title,
  variant = "planned",
  category,
  type,
  moveTargets,
  conflict = false,
  generated = false,
  fixed = false,
  onRemove,
  onMove,
}: CourseCardProps) => {
  const { openCourse } = useCourseDrawerStore();
  const openDetails = () => courseId && openCourse(courseId);
  const isMobile = useMediaQuery("sm"); // max-width: 639.98px

  const showMoveMenu =
    variant === "planned" && !fixed && moveTargets && moveTargets.length > 0;

  return (
    <div
      className={cn(
        "relative border-2 border-transparent transition-colors animate-[border-pulse-in_300ms_ease] flex h-full flex-col gap-3 rounded-xl bg-background p-2 sm:py-4 sm:px-3",
        generated && "border-expert-blue",
        conflict && "border-negative",
      )}
    >
      <div className="flex flex-1 flex-col gap-2">
        <div
          title={title}
          className={cn(
            "h-[3lh] line-clamp-3 text-xs sm:text-sm leading-snug font-medium text-fg-primary",
            showMoveMenu && "pr-6",
          )}
        >
          {title}
        </div>
        <CourseBadges
          variant="planned"
          category={category}
          type={type}
          isMobile={isMobile}
          className="mt-auto"
        />
      </div>

      {showMoveMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Перенести в семестр"
            className="absolute top-1 sm:top-3 right-1 grid size-6 cursor-pointer place-items-center rounded-md text-fg-secondary transition-colors duration-(--std-duration) hover:bg-accent-pale-hover hover:text-fg-primary focus-visible:ring-0 focus-visible:outline-none"
          >
            <ArrowRightLeft className="size-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {moveTargets.map((n) => (
              <DropdownMenuItem key={n} onSelect={() => onMove?.(n)}>
                {n} семестр
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Separator />

      <div
        className={cn(
          "mt-auto flex items-center gap-2",
          variant === "planned" ? "justify-between" : "justify-center",
        )}
      >
        <Button
          variant={variant === "planned" ? "tertiaryPadded" : "outline"}
          size="xs"
          className={isMobile ? "flex-1" : undefined}
          icon={isMobile ? <Info size={20} /> : undefined}
          onClick={openDetails}
        >
          {isMobile ? undefined : <span className="text-base">О курсе</span>}
        </Button>
        {variant === "planned" && (
          <Button
            variant={fixed ? "tertiaryPadded" : "destructive"}
            size="xs"
            disabled={fixed}
            className={isMobile ? "flex-1" : undefined}
            icon={isMobile ? <Trash2 size={20} /> : undefined}
            onClick={fixed ? undefined : onRemove}
          >
            {isMobile ? undefined : <span className="text-base">Удалить</span>}
          </Button>
        )}
      </div>
    </div>
  );
};
