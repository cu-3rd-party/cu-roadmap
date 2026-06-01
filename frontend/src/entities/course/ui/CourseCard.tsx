import { ArrowRightLeft } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/kit/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { Separator } from "@/shared/ui/kit/separator";

import { MOCK_COURSE_DETAILS } from "../model";

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
  // select variant only: renders a brand-colored border when true 
  selected?: boolean;
  // planned variant only: semesters offered in the "move to" menu (already excludes current)
  moveTargets?: number[];
  onSelect?: () => void;
  onRemove?: () => void;
  onMove?: (toSemester: number) => void;
}

export const CourseCard = ({
  title,
  variant = "catalog",
  selected = false,
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
        className={cn("flex flex-col border-2 border-transparent rounded-xl bg-background py-4 px-3 text-left transition-colors duration-(--std-duration) cursor-pointer",
                      "hover:bg-accent-pale-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      selected && "border-accent/80")}
      >
        <div
          title={title}
          className="text-sm leading-snug font-medium text-fg-primary "
        >
          {title}
        </div>
      </button>
    );
  }

  const showMoveMenu =
    variant === "planned" && moveTargets && moveTargets.length > 0;

  return (
    <div className="relative flex flex-col gap-3 rounded-xl bg-background p-4">
      <div
        title={title}
        className={cn(
          "line-clamp-2 text-sm leading-snug font-medium text-fg-primary",
          showMoveMenu && "pr-7",
        )}
      >
        {title}
      </div>

      {showMoveMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Перенести в семестр"
            className="absolute top-2 right-2 grid size-6 cursor-pointer place-items-center rounded-md text-fg-secondary transition-colors hover:bg-accent-pale-hover hover:text-fg-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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

      <div className="mt-auto flex items-center justify-between gap-2">
        <Button variant="tertiary" size="xs" onClick={() => setDetailsOpen(true)}>
          <span className="text-base">О курсе</span>
        </Button>
        {variant === "planned" ? (
          <Button
            variant="destructive"
            size="xs"
            onClick={onRemove}
          >
            <span className="text-base">Удалить</span>
          </Button>
        ) : (
          <Button variant="outline" size="xs">
            <span className="text-base">Выбрать</span>
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
