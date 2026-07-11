import { ArrowRightLeft, Ellipsis, Info, Plus, Trash2 } from "lucide-react";

import { SemesterNumber } from "@/shared/constants";
import { cn, useMediaQuery } from "@/shared/lib";
import {
  categorySlugToName,
  categorySlugToShortName,
  CourseCategory,
  CourseType,
  typeSlugToName,
  type UUID,
} from "@/shared/model";
import {
  Badge,
  Button,
  Counter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
} from "@/shared/ui/kit";

import { useCourseDrawerStore } from "../model";

export type CourseCardVariant = "catalog" | "select" | "planned";

interface CourseCardProps {
  // course id used to open the shared details drawer (catalog/planned variants)
  courseId?: UUID;
  title: string;
  recommendedSemester?: SemesterNumber | null;
  /**
   - catalog (default): "О курсе" + "Выбрать"
   - select: the whole card is clickable (used inside the add-course modal)
   - planned: "О курсе" + "Удалить" (used inside a semester block)
  **/
  variant?: CourseCardVariant;
  // course-category badge label (orange), e.g. "Fundamentals", "Major Core"
  category?: CourseCategory;
  // major badge label (blue), e.g. "SE", "Business", "AI"
  type?: CourseType;
  // select variant only: renders a brand-colored border when true
  selected?: boolean;
  // select variant only: semester (1-8) this course is currently placed in.
  // Shown as a corner counter; selection is tracked across all semesters.
  selectedSemester?: SemesterNumber;
  // semesters offered in the card menu. planned/selected-catalog: "move to"
  // targets (already excludes current). unselected-catalog: "add to" targets.
  moveTargets?: number[];
  // planned variant only: renders a negative ring when the course has a validation conflict
  conflict?: boolean;
  // planned variant only: blue highlight for courses just added by the generate
  // algorithm. A conflict (red) takes precedence over this.
  generated?: boolean;
  // course is pinned to its semester: select/planned actions (deselect, move,
  // delete) are disabled. Drag-reordering stays allowed (lives on the wrapper).
  fixed?: boolean;
  // select variant only: card is shown but not actionable here (course lives in
  // another semester, or is fixed). Renders dimmed + non-clickable.
  disabled?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  onMove?: (toSemester: number) => void;
}

const CourseBadges = ({
  variant,
  category,
  type,
  recommendedSemester,
  isMobile,
  className,
}: Pick<
  CourseCardProps,
  "variant" | "category" | "type" | "recommendedSemester"
> & { className?: string; isMobile: boolean }) => {
  if (!category && !type) return null;
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {category && (
        <Badge variant="orange" size="3xs">
          {variant == "planned" && !isMobile
            ? categorySlugToName[category]
            : categorySlugToShortName[category]}
        </Badge>
      )}
      {type && (
        <Badge variant="blue" size="3xs">
          {typeSlugToName[type]}
        </Badge>
      )}
      {recommendedSemester && (
        <Badge variant="green" size="3xs">
          {"Рек. сем: " + recommendedSemester}
        </Badge>
      )}
    </div>
  );
};

export const CourseCard = ({
  courseId,
  title,
  recommendedSemester,
  variant = "catalog",
  category,
  type,
  selected = false,
  selectedSemester,
  moveTargets,
  conflict = false,
  generated = false,
  fixed = false,
  disabled = false,
  onSelect,
  onRemove,
  onMove,
}: CourseCardProps) => {
  const { openCourse } = useCourseDrawerStore();
  const openDetails = () => courseId && openCourse(courseId);
  const isMobile = useMediaQuery("sm"); // max-width: 639.98px

  if (variant === "select") {
    return (
      <button
        type="button"
        onClick={disabled ? undefined : onSelect}
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
          title={title}
          className="min-h-[2lh] text-sm leading-snug font-medium text-fg-primary"
        >
          {title}
        </div>
        <CourseBadges
          variant="select"
          category={category}
          type={type}
          recommendedSemester={recommendedSemester}
          isMobile={isMobile}
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
    );
  }

  if (variant === "catalog") {
    const isSelected = selectedSemester !== undefined;
    const menuTargets = moveTargets ?? [];
    // selected courses always get a menu (delete is always available); unselected
    // ones only when there's at least one semester to add to. fixed = no menu.
    const showMenu = !fixed && (isSelected || menuTargets.length > 0);
    return (
      <div className="relative h-full">
        <button
          type="button"
          onClick={openDetails}
          className={cn(
            "relative flex h-full w-full flex-col gap-2 border-2 border-transparent rounded-xl bg-background py-4 px-2 sm:px-3 text-left transition-colors duration-(--std-duration) cursor-pointer",
            "hover:bg-accent-pale-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            selected && "border-accent/80",
          )}
        >
          <div
            title={title}
            className={cn(
              "min-h-[2lh] text-sm leading-snug font-medium text-fg-primary",
              showMenu && "pr-6",
            )}
          >
            {title}
          </div>
          <CourseBadges
            variant="catalog"
            category={category}
            type={type}
            recommendedSemester={recommendedSemester}
            isMobile={isMobile}
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
                <DropdownMenuItem key={n} onSelect={() => onMove?.(n)}>
                  {n} семестр
                </DropdownMenuItem>
              ))}
              {isSelected && menuTargets.length > 0 && (
                <DropdownMenuSeparator />
              )}
              {isSelected && (
                <DropdownMenuItem
                  className="text-negative"
                  onSelect={() => onRemove?.()}
                >
                  Удалить
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  const showMoveMenu =
    variant === "planned" && !fixed && moveTargets && moveTargets.length > 0;

  return (
    <div
      className={cn(
        "relative border-2 border-transparent transition-colors animate-[border-pulse-in_300ms_ease] flex h-full flex-col gap-3 rounded-xl bg-background p-2 sm:py-4 sm:pl-4",
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
