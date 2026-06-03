import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";

import { CourseCard, type Course } from "@/entities/course";
import { usePlannerStore } from "@/entities/roadmap";
import { CourseSelectModal } from "@/features/course-select";
import { useSettingsStore } from "@/features/settings";
import { admissionYearToSemester, TOTAL_SEMESTERS } from "@/shared/constants";
import { CollapsiblePanel, Panel } from "@/shared/ui";

import { AddCourseButton } from "./AddCourseButton";
import { SortableCourseCard } from "./SortableCourseCard";


export interface SemesterSectionProps {
  index: number;
  dateRange: string;
  courses: Course[];
  coursesLoading: boolean;
  coursesError: boolean;
}

export const SemesterSection = ({
  index,
  dateRange,
  courses: catalogCourses,
  coursesLoading,
  coursesError,
}: SemesterSectionProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeWidth, setActiveWidth] = useState<number | undefined>(undefined);
  const [activeHeight, setActiveHeight] = useState<number | undefined>(
    undefined,
  );
  const { selections, removeCourse, moveCourse, reorderCourses } =
    usePlannerStore();
  const { admissionYear, hideCompletedSemesters } = useSettingsStore();
  const courses = selections[index] ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const courseIds = useMemo(() => courses.map((c) => c.id), [courses]);
  const activeCourse = courses.find((c) => c.id === activeId) ?? null;

  const isCompleted =
    admissionYear != null && index < admissionYearToSemester[admissionYear];

  const moveTargets = useMemo(
    () =>
      Array.from({ length: TOTAL_SEMESTERS }, (_, i) => i + 1).filter(
        (n) => n !== index,
      ),
    [index],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setActiveWidth(event.active.rect.current.initial?.width);
    setActiveHeight(event.active.rect.current.initial?.height);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      reorderCourses(index, String(active.id), String(over.id));
    }
  };

  const handleDragCancel = () => setActiveId(null);

  if (isCompleted && hideCompletedSemesters) return null;

  return (
    <Panel>
      <div className="mb-4 flex items-center gap-2.5 px-1">
        <h2 className="text-lg font-bold text-fg-primary">{index} семестр</h2>
        <span className="text-sm text-fg-secondary">{dateRange}</span>
        {isCompleted && (
          <span className="ml-auto flex size-6 items-center justify-center rounded-full bg-positive text-fg-primary-on_dark">
            <Check className="size-4" strokeWidth={3} />
          </span>
        )}
      </div>

      <CollapsiblePanel title="Выбери курсы">
        <div className="flex flex-col gap-1 p-1">
          {courses.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={courseIds} strategy={rectSortingStrategy}>
                <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-6">
                  {courses.map((course) => (
                    <SortableCourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      category={course.category}
                      type={course.type}
                      moveTargets={moveTargets}
                      onRemove={() => removeCourse(index, course.id)}
                      onMove={(to) => moveCourse(index, to, course.id)}
                    />
                  ))}
                  <AddCourseButton
                    variant="card"
                    onClick={() => setModalOpen(true)}
                  />
                </div>
              </SortableContext>

              <DragOverlay>
                {activeCourse ? (
                  <div style={{ width: activeWidth, height: activeHeight }}>
                    <CourseCard
                      variant="planned"
                      title={activeCourse.title}
                      category={activeCourse.category}
                      type={activeCourse.type}
                      moveTargets={moveTargets}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <AddCourseButton onClick={() => setModalOpen(true)} />
          )}
        </div>
      </CollapsiblePanel>

      <CourseSelectModal
        semester={index}
        courses={catalogCourses}
        isLoading={coursesLoading}
        isError={coursesError}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </Panel>
  );
};
