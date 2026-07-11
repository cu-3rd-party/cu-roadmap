import { useMemo } from "react";

import { Course, CourseCard } from "@/entities/course";
import { usePlannerStore } from "@/entities/roadmap";
import type { SemesterNumber } from "@/shared/constants";
import { CollapsiblePanel, Panel } from "@/shared/ui/panel";

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

  // Selection is tracked across ALL semesters
  const semesterByCourseId = useMemo(() => {
    const map = new Map<string, number>();
    for (const [sem, list] of Object.entries(selections)) {
      for (const c of list) map.set(c.id, Number(sem));
    }
    return map;
  }, [selections]);

  return (
    <Panel className="px-2 sm:px-4 lg:px-6">
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <h2 className="text-lg font-bold text-fg-primary">{title}</h2>
      </div>

      <CollapsiblePanel title={panelTitle}>
        <div className="grid gap-1 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {courses.map((course) => {
            const selectedSemester = semesterByCourseId.get(course.id) as
              | SemesterNumber
              | undefined;
            const isSelected = selectedSemester !== undefined;
            // add: any semester the course is offered in. move: same, minus current.
            const menuTargets = isSelected
              ? course.availableSemesters.filter((n) => n !== selectedSemester)
              : course.availableSemesters;
            return (
              <CourseCard
                key={course.id}
                variant="catalog"
                courseId={course.id}
                title={course.title}
                recommendedSemester={course.recommendedSemester}
                category={course.category}
                type={course.type}
                selected={isSelected}
                selectedSemester={selectedSemester}
                fixed={(course.fixedSemester ?? 0) >= 1}
                moveTargets={menuTargets}
                onMove={(to) =>
                  isSelected
                    ? moveCourse(selectedSemester, to, course.id)
                    : addCourse(to, {
                        id: course.id,
                        title: course.title,
                        category: course.category,
                        type: course.type,
                      })
                }
                onRemove={() =>
                  isSelected && removeCourse(selectedSemester, course.id)
                }
              />
            );
          })}
        </div>
      </CollapsiblePanel>
    </Panel>
  );
};
