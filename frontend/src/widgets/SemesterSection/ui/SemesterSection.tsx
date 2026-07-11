import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Check, Loader2, Trash, Weight } from "lucide-react";
import { useMemo, useState } from "react";

import { CourseCard, StatusPanel, type Course } from "@/entities/course";
import { isSemesterCompleted, usePlannerStore } from "@/entities/roadmap";
import { CourseSelectModal } from "@/features/course-select";
import { ResetConfirmModal } from "@/features/planner-reset";
import { useSettingsStore } from "@/features/settings";
import { pluralizeRu, useMediaQuery } from "@/shared/lib";
import { Badge, Button, CollapsiblePanel, Panel } from "@/shared/ui";

import { AddCourseButton } from "./AddCourseButton";
import { SortableCourseCard } from "./SortableCourseCard";

export interface SemesterSectionProps {
  index: number;
  courses: Course[];
  coursesLoading: boolean;
  coursesError: boolean;
  identifying?: boolean;
}

export const SemesterSection = ({
  index,
  courses: catalogCourses,
  coursesLoading,
  coursesError,
  identifying,
}: SemesterSectionProps) => {
  const isMobile = useMediaQuery("sm");

  const [modalOpen, setModalOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const {
    selections,
    validation,
    generatedIds,
    removeCourse,
    clearSemester,
    moveCourse,
    reorderCourses,
  } = usePlannerStore();
  const { admissionYear, hideCompletedSemesters } = useSettingsStore();
  const courses = selections[index] ?? [];
  const hasResettableCourses = courses.some((c) => !c.fixed);

  const courseById = useMemo(
    () => new Map(catalogCourses.map((course) => [course.id, course])),
    [catalogCourses],
  );

  const totalWorkload = useMemo(
    () =>
      courses.reduce(
        (sum, c) => sum + (courseById.get(c.id)?.workload ?? 0),
        0,
      ),
    [courses, courseById],
  );

  // Move menu only offers semesters the course is actually available in.
  const moveTargetsFor = (id: string) =>
    (courseById.get(id)?.availableSemesters ?? []).filter((n) => n !== index);

  // Desktop (mouse) starts dragging instantly on an 8px move. Touch requires a
  // short press-and-hold so a quick swipe scrolls the page instead of hijacking
  // it into a drag (the delay is aborted if the finger moves past the tolerance).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const courseIds = useMemo(() => courses.map((c) => c.id), [courses]);
  const activeCourse = courses.find((c) => c.id === activeId) ?? null;

  const isCompleted =
    admissionYear != null && isSemesterCompleted(index, admissionYear);

  // This semester's conflict messages
  const semesterMessages = useMemo(
    () =>
      validation
        .find((v) => v.semester === index)
        ?.messages.map((m) => m.message) ?? [],
    [validation, index],
  );

  const conflictIds = useMemo(() => {
    const ids = new Set<string>();
    for (const sem of validation) {
      for (const msg of sem.messages) {
        if (msg.courseId) ids.add(msg.courseId);
      }
    }
    return ids;
  }, [validation]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
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
    <Panel className="relative px-2 sm:px-4 lg:p-6 lg:pt-4">
      <div className="mb-4 flex min-h-10 items-center gap-2.5 px-1">
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 sm:items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-fg-primary">
              {index} семестр
            </h2>
            {totalWorkload > 0 && (
              <Badge
                variant="blue"
                size="xxs"
                aria-label="Академическая нагрузка семестра"
              >
                <Weight className="size-3" />
                {totalWorkload}{" "}
                {pluralizeRu(totalWorkload, ["пара", "пары", "пар"])}{" "}
                {isMobile ? "" : "в неделю"}
              </Badge>
            )}
            {identifying && (
              <Loader2
                className="size-4 animate-spin text-fg-secondary"
                aria-label="Загрузка…"
              />
            )}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {hasResettableCourses && (
            <Button
              variant="outline"
              size="sm"
              className={`text-negative hover:text-fg-negative ${isMobile && "border-0"}`}
              icon={isMobile ? <Trash /> : undefined}
              onClick={() => setResetOpen(true)}
            >
              {isMobile ? undefined : "Сбросить курсы"}
            </Button>
          )}
          {isCompleted && (
            <span className="ml-auto flex size-6 items-center justify-center rounded-full bg-positive text-fg-primary-on_dark">
              <Check className="size-4" strokeWidth={3} />
            </span>
          )}
        </div>
      </div>

      {semesterMessages.length > 0 && (
        <div className="mb-4">
          <StatusPanel messages={semesterMessages} />
        </div>
      )}

      <CollapsiblePanel
        title={
          !isCompleted
            ? "Выбери курсы"
            : "Отметь уже пройденные в семестре курсы"
        }
      >
        <div className="flex flex-col gap-1">
          {courses.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={courseIds} strategy={rectSortingStrategy}>
                <div className="grid gap-1 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {courses.map((course) => (
                    <SortableCourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      category={course.category}
                      type={course.type}
                      moveTargets={moveTargetsFor(course.id)}
                      conflict={conflictIds.has(course.id)}
                      generated={generatedIds.has(course.id)}
                      fixed={course.fixed}
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
                  <div className="h-full cursor-grabbing rounded-xl">
                    <CourseCard
                      variant="planned"
                      courseId={activeCourse.id}
                      title={activeCourse.title}
                      category={activeCourse.category}
                      type={activeCourse.type}
                      moveTargets={moveTargetsFor(activeCourse.id)}
                      conflict={conflictIds.has(activeCourse.id)}
                      generated={generatedIds.has(activeCourse.id)}
                      fixed={activeCourse.fixed}
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

      <ResetConfirmModal
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Сбросить курсы в семестре"
        showKeepCompleted={false}
        onConfirm={() => clearSemester(index)}
      />
    </Panel>
  );
};
