import { CourseCardSkeleton } from "@/entities/course";
import type { DisciplineGroup } from "@/entities/disciplineGroup";
import { getErrorMessage } from "@/shared/api";
import { Panel } from "@/shared/ui";

import { AdminGroupCard } from "./AdminGroupCard";

interface AdminGroupGridProps {
  groups?: DisciplineGroup[];
  isLoading: boolean;
  error: unknown;
  onDelete: (group: DisciplineGroup) => void;
}

// Same column steps and skeleton as AdminCourseGrid — the two cards share a
// shell, so anything else would make the tabs of the requisite picker and these
// two screens disagree about how wide a card is.
const GRID =
  "grid gap-1 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

const SKELETON_COUNT = 12;

export const AdminGroupGrid = ({
  groups,
  isLoading,
  error,
  onDelete,
}: AdminGroupGridProps) => {
  if (isLoading)
    return (
      <div className={GRID}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    );

  if (error)
    return (
      <Panel>
        <p className="text-sm text-negative">{getErrorMessage(error)}</p>
      </Panel>
    );

  if (!groups?.length)
    return (
      <Panel>
        <p className="text-sm text-fg-muted">Коробки не найдены.</p>
      </Panel>
    );

  return (
    <div className={GRID}>
      {groups.map((group) => (
        <AdminGroupCard key={group.id} group={group} onDelete={onDelete} />
      ))}
    </div>
  );
};
