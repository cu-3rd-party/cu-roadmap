import { useState } from "react";

import { Button } from "@/shared/ui/kit/button";
import { Separator } from "@/shared/ui/kit/separator";

import { MOCK_COURSE_DETAILS } from "../model/details";

import { DetailsDrawer } from "./DetailsDrawer";

export type CourseCardVariant = "catalog" | "select" | "planned";

interface CourseCardProps {
  title: string;
  /**
   * - `catalog` (default): "О курсе" + "Выбрать"
   * - `select`: single centered "Выбрать" (used inside the add-course modal)
   * - `planned`: "О курсе" + "Удалить" (used inside a semester block)
   */
  variant?: CourseCardVariant;
  onSelect?: () => void;
  onRemove?: () => void;
}

export const CourseCard = ({
  title,
  variant = "catalog",
  onSelect,
  onRemove,
}: CourseCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const showDetails = variant !== "select";

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-background p-4">
      <div className="text-sm leading-snug font-medium text-fg-primary">
        {title}
      </div>

      <Separator />

      {variant === "select" ? (
        <div className="mt-auto flex justify-center">
          <Button variant="outline" size="xs" onClick={onSelect}>
            <span className="text-base">Выбрать</span>
          </Button>
        </div>
      ) : (
        <div className="mt-auto flex items-center justify-between gap-2">
          <Button
            variant="tertiary"
            size="xs"
            onClick={() => setDetailsOpen(true)}
          >
            <span className="text-base">О курсе</span>
          </Button>
          {variant === "planned" ? (
            <Button
              variant="outline"
              size="xs"
              className="text-negative"
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
      )}

      {showDetails && (
        <DetailsDrawer
          course={MOCK_COURSE_DETAILS}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  );
};
