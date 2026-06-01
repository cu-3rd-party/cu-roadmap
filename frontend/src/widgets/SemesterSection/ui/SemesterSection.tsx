import { useState } from "react";

import { CourseCard } from "@/entities/course";
import { CourseSelectModal } from "@/features/course-select";
import { usePlannerStore } from "@/shared/store";
import { CollapsiblePanel, Panel } from "@/shared/ui/panel";

import { AddCourseButton } from "./AddCourseButton";

export interface SemesterSectionProps {
  index: number;
  dateRange: string;
}

export const SemesterSection = ({ index, dateRange }: SemesterSectionProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { selections, removeCourse } = usePlannerStore();
  const courses = selections[index] ?? [];

  return (
    <Panel>
      <div className="mb-4 flex items-baseline gap-2.5 px-1">
        <h2 className="text-lg font-bold text-fg-primary">{index} семестр</h2>
        <span className="text-sm text-fg-secondary">{dateRange}</span>
      </div>

      <CollapsiblePanel title="Выбери курсы">
        <div className="flex flex-col gap-1 p-1">
          {courses.length > 0 && (
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  title={course.title}
                  variant="planned"
                  onRemove={() => removeCourse(index, course.id)}
                />
              ))}
            </div>
          )}
          <AddCourseButton onClick={() => setModalOpen(true)} />
        </div>
      </CollapsiblePanel>

      <CourseSelectModal
        semester={index}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </Panel>
  );
};
