import { CourseCard, CourseCardSkeleton } from "@/entities/course";
import type { UUID } from "@/shared/model";
import { AddCourseButton, CollapsiblePanel } from "@/shared/ui";

/* One card in a requisites panel. A prerequisite group holding several courses is a
   "коробка" — any one of them satisfies it — so it collapses to a single card with no
   courseId, which leaves its "О курсе" button inert. */
export interface RequisiteEntry {
  key: string;
  title: string;
  courseId?: UUID;
}

interface CourseRequisitesPanelProps {
  title: string;
  entries: RequisiteEntry[];
  loading?: boolean;
  onAdd?: () => void;
}

const GRID_CLASS =
  "grid gap-1 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

export const CourseRequisitesPanel = ({
  title,
  entries,
  loading = false,
  onAdd,
}: CourseRequisitesPanelProps) => (
  <CollapsiblePanel title={title}>
    <div className="flex flex-col gap-1">
      {loading ? (
        <div className={GRID_CLASS}>
          {Array.from({ length: 3 }).map((_, index) => (
            <CourseCardSkeleton key={`requisite-skeleton-${index}`} />
          ))}
        </div>
      ) : entries.length > 0 ? (
        <div className={GRID_CLASS}>
          {entries.map((entry) => (
            <CourseCard
              key={entry.key}
              variant="select"
              courseId={entry.courseId}
              title={entry.title}
            />
          ))}
          <AddCourseButton
            variant="card"
            label="Курс/коробка"
            onClick={onAdd}
          />
        </div>
      ) : (
        <AddCourseButton label="Курс/коробка" onClick={onAdd} />
      )}
    </div>
  </CollapsiblePanel>
);
