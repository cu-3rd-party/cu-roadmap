import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import type { DisciplineGroup } from "@/entities/disciplineGroup";
import { DisciplineGroupBadges } from "@/entities/disciplineGroup";
import { Button, Separator } from "@/shared/ui/kit";

interface AdminGroupCardProps {
  group: DisciplineGroup;
  onDelete: (group: DisciplineGroup) => void;
}

/* AdminCourseCard's shell, unchanged down to the class strings so the Курсы and
   Коробки grids read as one thing. Delete stays a *sibling* of the link, not a
   child — that is what keeps "click the card" and "click delete" apart without
   nesting one interactive element inside another. */
export const AdminGroupCard = ({ group, onDelete }: AdminGroupCardProps) => (
  <div className="flex h-full flex-col gap-3 rounded-xl bg-background p-2 transition-colors duration-(--std-duration) hover:bg-accent-pale-hover sm:px-3 sm:py-4">
    <Link
      to={`/admin/boxes/${group.id}`}
      className="flex flex-1 flex-col gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div
        title={group.title}
        className="h-[3lh] line-clamp-3 text-xs leading-snug font-medium text-fg-primary sm:text-sm"
      >
        {group.title}
      </div>
      <DisciplineGroupBadges group={group} className="mt-auto" />
    </Link>

    <Separator />

    <Button
      variant="destructive"
      size="xs"
      className="mx-auto"
      icon={<Trash2 size={16} />}
      onClick={() => onDelete(group)}
    >
      Удалить
    </Button>
  </div>
);
