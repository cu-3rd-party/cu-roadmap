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

import {
  buildCourseTitleMap,
  CourseCard,
  courseToDetails,
  StatusPanel,
  type Course,
} from "@/entities/course";
import { useMajorsQuery } from "@/entities/major";
import {
  isSemesterCompleted,
  usePlannerStore,
  useValidatePlan,
} from "@/entities/roadmap";
import { CourseSelectModal } from "@/features/course-select";
import { useSettingsStore } from "@/features/settings";
import { Button, CollapsiblePanel, Panel } from "@/shared/ui";

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
  const { data: majors } = useMajorsQuery(admissionYear);
  const courses = selections[index] ?? [];

  const titleMap = useMemo(
    () => buildCourseTitleMap(catalogCourses),
    [catalogCourses],
  );

  const majorTitleMap = useMemo(
    () => new Map((majors ?? []).map((major) => [major.id, major.title])),
    [majors],
  );

  const courseById = useMemo(
    () => new Map(catalogCourses.map((course) => [course.id, course])),
    [catalogCourses],
  );

  const detailsFor = (id: string) => {
    const course = courseById.get(id);
    return course
      ? courseToDetails(course, { titleMap, majorTitleMap })
      : undefined;
  };

  // Move menu only offers semesters the course is actually available in.
  const moveTargetsFor = (id: string) =>
    (courseById.get(id)?.availableSemesters ?? []).filter((n) => n !== index);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const courseIds = useMemo(() => courses.map((c) => c.id), [courses]);
  const activeCourse = courses.find((c) => c.id === activeId) ?? null;

  const isCompleted =
    admissionYear != null && isSemesterCompleted(index, admissionYear);

  // Re-validate the whole plan (stores result for the conflict panels/rings).
  const validate = useValidatePlan();
  const runValidation = () => validate(admissionYear);

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
    <Panel className="relative border  border-positive-pale">
      <div className="mb-4 flex items-center gap-2.5 px-1">
        <h2 className="text-lg font-bold text-fg-primary">{index} семестр</h2>
        <span className="text-sm text-fg-secondary">{dateRange}</span>
        <div className="ml-auto flex items-center gap-4">
          {courses.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-negative hover:text-fg-negative"
              onClick={() => {
                clearSemester(index);
                runValidation();
              }}
            >
              Сбросить курсы
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
                <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-5">
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
                      onRemove={() => {
                        removeCourse(index, course.id);
                        runValidation();
                      }}
                      onMove={(to) => {
                        moveCourse(index, to, course.id);
                        runValidation();
                      }}
                      details={detailsFor(course.id)}
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
                  <div>
                    <CourseCard
                      variant="planned"
                      title={activeCourse.title}
                      category={activeCourse.category}
                      type={activeCourse.type}
                      moveTargets={moveTargetsFor(activeCourse.id)}
                      conflict={conflictIds.has(activeCourse.id)}
                      generated={generatedIds.has(activeCourse.id)}
                      details={detailsFor(activeCourse.id)}
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
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) runValidation();
        }}
      />
    </Panel>
  );
};
