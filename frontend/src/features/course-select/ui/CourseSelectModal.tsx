import { useMemo } from "react";

import { CourseCard } from "@/entities/course";
import { usePlannerStore } from "@/entities/roadmap";
import { CourseSearchFilter } from "@/features/course-filters";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/kit/dialog";

import { AVAILABLE_COURSES } from "../model/courses";
import {
  availableCategoryOptions,
  filterAvailableCourses,
} from "../model/filter";
import { useCourseSelectFiltersStore } from "../model/store";

interface CourseSelectModalProps {
  semester: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CourseSelectModal = ({
  semester,
  open,
  onOpenChange,
}: CourseSelectModalProps) => {
  const { selections, addCourse, removeCourse } = usePlannerStore();
  const { filters, toggleCategory, setSearch } = useCourseSelectFiltersStore();

  const selectedIds = useMemo(
    () => new Set((selections[semester] ?? []).map((c) => c.id)),
    [selections, semester],
  );

  const categoryOptions = useMemo(
    () => availableCategoryOptions(AVAILABLE_COURSES, filters),
    [filters],
  );

  const visibleCourses = useMemo(
    () => filterAvailableCourses(AVAILABLE_COURSES, filters),
    [filters],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex h-[42rem] max-h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-3xl bg-expert-blue-pale p-0 max-w-xl md:max-w-2xl lg:max-w-5xl xl:max-w-7xl"
      >
        <DialogHeader className="relative shrink-0 px-8 pt-7 pb-4 overflow-hidden">
          <DialogTitle className="text-2xl font-bold text-fg-primary">
            Доступные курсы
          </DialogTitle>
          <img
            src="/character.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute -top-1 right-16 h-32 w-auto select-none object-contain"
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

        <div className="min-h-0 flex-1 overflow-y-auto bg-expert-blue-pale pl-4 pr-3 pb-3">
          <div className="grid gap-1 grid-cols-2 lg:grid-cols-5">
            {visibleCourses.map((course) => {
              const isSelected = selectedIds.has(course.id);
              return (
                <CourseCard
                  key={course.id}
                  title={course.title}
                  variant="select"
                  selected={isSelected}
                  onSelect={() =>
                    isSelected
                      ? removeCourse(semester, course.id)
                      : addCourse(semester, course)
                  }
                />
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
