import { useMemo } from "react";

import { CourseCard, type Course } from "@/entities/course";
import { usePlannerStore } from "@/entities/roadmap";
import { CourseSearchFilter } from "@/features/course-filters";
import type { SemesterNumber } from "@/shared/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/kit/dialog";

import {
  availableCategoryOptions,
  filterAvailableCourses,
} from "../model/filter";
import { useCourseSelectFiltersStore } from "../model/store";

interface CourseSelectModalProps {
  semester: number;
  courses: Course[];
  isLoading: boolean;
  isError: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CourseSelectModal = ({
  semester,
  courses,
  isLoading,
  isError,
  open,
  onOpenChange,
}: CourseSelectModalProps) => {
  const { selections, addCourse, removeCourse } = usePlannerStore();
  const { filters, toggleCategory, setSearch } = useCourseSelectFiltersStore();

  const selectedIds = useMemo(
    () => new Set((selections[semester] ?? []).map((c) => c.id)),
    [selections, semester],
  );

  // Only courses offered in this semester are selectable from this modal.
  const semesterCourses = useMemo(
    () =>
      courses.filter((course) =>
        course.availableSemesters.includes(semester as SemesterNumber),
      ),
    [courses, semester],
  );

  const categoryOptions = useMemo(
    () => availableCategoryOptions(semesterCourses, filters),
    [semesterCourses, filters],
  );

  const visibleCourses = useMemo(
    () => filterAvailableCourses(semesterCourses, filters),
    [semesterCourses, filters],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex h-[42rem] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-3xl bg-expert-blue-pale p-0 max-w-xl md:max-w-2xl lg:max-w-5xl xl:max-w-7xl"
      >
        <DialogHeader className="relative shrink-0 px-8 pt-7 pb-4 overflow-hidden">
          <DialogTitle className="text-2xl font-bold text-fg-primary">
            Доступные курсы
          </DialogTitle>
          <img
            src="/character3.png"
            alt="Персонаж 3"
            aria-hidden
            className="pointer-events-none absolute top-1 right-16 h-32 w-auto select-none object-contain"
          />
        </DialogHeader>

        <div className="relative z-10 shrink-0 px-3 pb-1">
          <div className="flex flex-col gap-3 rounded-2xl bg-background p-4 ">
            <CourseSearchFilter
              search={filters.search}
              onSearchChange={setSearch}
              selectedCategories={filters.categories}
              onToggleCategory={toggleCategory}
              categories={categoryOptions}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-expert-blue-pale pl-4 pr-3 pb-3 scrollbar-gutter-stable">
          {isLoading ? (
            <p className="px-1 py-4 text-sm text-fg-secondary">
              Загрузка курсов…
            </p>
          ) : isError ? (
            <p className="px-1 py-4 text-sm text-fg-negative">
              Не удалось загрузить курсы. Попробуйте обновить страницу.
            </p>
          ) : visibleCourses.length === 0 ? (
            <p className="px-1 py-4 text-sm text-fg-secondary">
              Нет курсов, доступных в этом семестре.
            </p>
          ) : (
            <div className="grid gap-1 grid-cols-2 lg:grid-cols-5">
              {visibleCourses.map((course) => {
                const isSelected = selectedIds.has(course.id);
                return (
                  <CourseCard
                    key={course.id}
                    title={course.title}
                    variant="select"
                    category={course.category}
                    type={course.type}
                    selected={isSelected}
                    onSelect={() =>
                      isSelected
                        ? removeCourse(semester, course.id)
                        : addCourse(semester, {
                            id: course.id,
                            title: course.title,
                            category: course.category,
                            type: course.type,
                          })
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
