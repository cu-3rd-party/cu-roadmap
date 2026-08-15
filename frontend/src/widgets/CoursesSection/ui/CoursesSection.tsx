import { useCallback, useMemo } from "react";

import {
  Course,
  CourseCatalogCard,
  useCourseDrawerStore,
} from "@/entities/course";
import { usePlannerStore } from "@/entities/roadmap";
import type { SemesterNumber } from "@/shared/constants";
import { CollapsiblePanel, Panel } from "@/shared/ui";

interface CourseCategorySectionProps {
  title: string;
  courses: Course[];
  panelTitle?: string;
}

export const CoursesSection = ({
  title,
  courses,
  panelTitle,
}: CourseCategorySectionProps) => {
  const { selections, addCourse, moveCourse, removeCourse } = usePlannerStore();
  const { openCourse } = useCourseDrawerStore();

  // Selection is tracked across ALL semesters
  const semesterByCourseId = useMemo(() => {
    const map = new Map<string, number>();
    for (const [sem, list] of Object.entries(selections)) {
      for (const c of list) map.set(c.id, Number(sem));
    }
    return map;
  }, [selections]);

  // Stable handlers so the memoized CourseCatalogCards don't all re-render when
  // `selections` changes (Zustand actions are stable references).
  const handleOpenDetails = useCallback(
    (courseId: Course["id"]) => openCourse(courseId),
    [openCourse],
  );

  const handleMove = useCallback(
    (course: Course, to: number, selectedSemester?: SemesterNumber) => {
      if (selectedSemester !== undefined) {
        moveCourse(selectedSemester, to, course.id);
      } else {
        addCourse(to, {
          id: course.id,
          title: course.title,
          category: course.category,
          type: course.type,
        });
      }
    },
    [addCourse, moveCourse],
  );

  const handleRemove = useCallback(
    (course: Course, selectedSemester: SemesterNumber) =>
      removeCourse(selectedSemester, course.id),
    [removeCourse],
  );

  return (
    <Panel className="px-2 sm:px-4 lg:px-6">
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <h2 className="text-lg font-bold text-fg-primary">{title}</h2>
      </div>

      <CollapsiblePanel title={panelTitle}>
        <div className="grid gap-1 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {courses.map((course) => (
            <CourseCatalogCard
              key={course.id}
              course={course}
              selectedSemester={
                semesterByCourseId.get(course.id) as SemesterNumber | undefined
              }
              onOpenDetails={handleOpenDetails}
              onMove={handleMove}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </CollapsiblePanel>
    </Panel>
  );
};
