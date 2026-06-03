import { ArrowRightLeft } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib";
import { categorySlugToName, CourseCategory, CourseType, typeSlugToName } from "@/shared/model";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator
} from "@/shared/ui/kit";

import { MOCK_COURSE_DETAILS, type CourseDetails } from "../model";

import { DetailsDrawer } from "./DetailsDrawer";


export type CourseCardVariant = "catalog" | "select" | "planned";

interface CourseCardProps {
  title: string;
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
  // catalog variant only: real course data shown in the "О курсе" drawer on click
  details?: CourseDetails;
  // planned variant only: semesters offered in the "move to" menu (already excludes current)
  moveTargets?: number[];
  onSelect?: () => void;
  onRemove?: () => void;
  onMove?: (toSemester: number) => void;
}

const CourseBadges = ({
  category,
  type,
  className,
}: Pick<CourseCardProps, "category" | "type"> & { className?: string }) => {
  if (!category && !type) return null;
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {category && (
        <Badge variant="orange" size="3xs">
          {categorySlugToName[category]}
        </Badge>
      )}
      {type && (
        <Badge variant="blue" size="3xs">
          {typeSlugToName[type]}
        </Badge>
      )}
    </div>
  );
};

export const CourseCard = ({
  title,
  variant = "catalog",
  category,
  type,
  selected = false,
  details,
  moveTargets,
  onSelect,
  onRemove,
  onMove,
}: CourseCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (variant === "select") {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn("flex h-full flex-col gap-2 border-2 border-transparent rounded-xl bg-background py-4 px-3 text-left transition-colors duration-(--std-duration) cursor-pointer",
                      "hover:bg-accent-pale-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      selected && "border-accent/80")}
      >
        <div
          title={title}
          className="line-clamp-2 text-sm leading-snug font-medium text-fg-primary"
        >
          {title}
        </div>
        <CourseBadges category={category} type={type} className="mt-auto"/>
      </button>
    );
  }

  if (variant === "catalog") {
    return (
      <>
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className={cn("flex h-full flex-col gap-2 border-2 border-transparent rounded-xl bg-background py-4 px-3 text-left transition-colors duration-(--std-duration) cursor-pointer",
                        "hover:bg-accent-pale-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none")}
        >
          <div
            title={title}
            className="line-clamp-2 text-sm leading-snug font-medium text-fg-primary"
          >
            {title}
          </div>
          <CourseBadges category={category} type={type} className="mt-auto"/>
        </button>

        {details && (
          <DetailsDrawer
            course={details}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
          />
        )}
      </>
    );
  }

  const showMoveMenu =
    variant === "planned" && moveTargets && moveTargets.length > 0;

  return (
    <div className="relative flex h-full flex-col gap-3 rounded-xl bg-background p-4">
      <div className="flex flex-1 flex-col gap-2">
        <div
          title={title}
          className={cn(
            "line-clamp-2 text-sm leading-snug font-medium text-fg-primary",
            showMoveMenu && "pr-7",
          )}
        >
          {title}
        </div>
        <CourseBadges category={category} type={type} className="mt-auto"/>
      </div>

      {showMoveMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Перенести в семестр"
            className="absolute top-2 right-2 grid size-6 cursor-pointer place-items-center rounded-md text-fg-secondary transition-colors duration-(--std-duration) hover:bg-accent-pale-hover hover:text-fg-primary focus-visible:ring-0 focus-visible:outline-none"
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

      <div className={`mt-auto flex items-center gap-2 ${variant === "planned" ? "justify-between" : "justify-center"}`}>
        <Button variant={variant === "planned" ? "tertiary" : "outline"} size="xs" onClick={() => setDetailsOpen(true)}>
          <span className="text-base">О курсе</span>
        </Button>
        {variant === "planned" && (
          <Button
            variant="destructive"
            size="xs"
            onClick={onRemove}
          >
            <span className="text-base">Удалить</span>
          </Button>
        )}
      </div>

      <DetailsDrawer
        course={MOCK_COURSE_DETAILS}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
};
