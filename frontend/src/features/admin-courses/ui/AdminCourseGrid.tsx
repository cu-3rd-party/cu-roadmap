import type { Course } from "@/entities/course";
import { CourseCardSkeleton } from "@/entities/course";
import { getErrorMessage } from "@/shared/api";
import { Panel } from "@/shared/ui";

import { AdminCourseCard } from "./AdminCourseCard";

interface AdminCourseGridProps {
  courses?: Course[];
  isLoading: boolean;
  error: unknown;
  onDelete: (course: Course) => void;
}

// Same column steps as the planner catalog, but deliberately without the
// Panel/CollapsiblePanel wrapper — the cards sit straight on the admin shell's
// background.
const GRID =
  "grid gap-1 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

const SKELETON_COUNT = 12;

export const AdminCourseGrid = ({
  courses,
  isLoading,
  error,
  onDelete,
}: AdminCourseGridProps) => {
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

  if (!courses?.length)
    return (
      <Panel>
        <p className="text-sm text-fg-muted">Курсы не найдены.</p>
      </Panel>
    );

  return (
    <div className={GRID}>
      {courses.map((course) => (
        <AdminCourseCard key={course.id} course={course} onDelete={onDelete} />
      ))}
    </div>
  );
};
