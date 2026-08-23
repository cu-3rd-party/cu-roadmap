import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button, Separator } from "@/shared/ui/kit";

interface RequisiteCardProps {
  title: string;
  badges?: ReactNode;
  onRemove: () => void;
}

/* The planner card's shell with a single action. CourseCard can't be configured
   for this — its "О курсе" button renders unconditionally and it hardcodes
   CourseBadges variant="planned" — so this follows AdminCourseCard's precedent
   of re-implementing the shell rather than adding props to a component the
   planner grid depends on. */
export const RequisiteCard = ({
  title,
  badges,
  onRemove,
}: RequisiteCardProps) => (
  <div className="flex h-full flex-col gap-3 rounded-xl bg-background p-2 sm:px-3 sm:py-4">
    <div className="flex flex-1 flex-col gap-2">
      <div
        title={title}
        className="h-[3lh] line-clamp-3 text-xs leading-snug font-medium text-fg-primary sm:text-sm"
      >
        {title}
      </div>
      {badges}
    </div>

    <Separator />

    <Button
      variant="destructive"
      size="xs"
      className="mx-auto"
      icon={<Trash2 size={16} />}
      onClick={onRemove}
    >
      Удалить
    </Button>
  </div>
);
