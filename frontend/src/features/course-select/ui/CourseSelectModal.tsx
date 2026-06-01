import { useMemo } from "react";

import { CourseCard } from "@/entities/course";
import {
  CourseSearchFilter,
  useCourseFilters,
} from "@/features/course-filters";
import { usePlannerStore } from "@/shared/store";
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
  const { addCourse } = usePlannerStore();
  const { filters, toggleCategory, setSearch } = useCourseFilters();

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
        className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden rounded-3xl bg-expert-blue-pale p-0 sm:max-w-screen-xl"
      >
        <DialogHeader className="relative shrink-0 px-8 pt-7 pb-4">
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

        <div className="flex flex-col gap-1 overflow-y-auto px-3 pb-3 z-1">
          <div className="flex flex-col gap-3 rounded-2xl bg-background p-4">
            <CourseSearchFilter
              search={filters.search}
              onSearchChange={setSearch}
              selectedCategories={filters.categories}
              onToggleCategory={toggleCategory}
              categories={categoryOptions}
            />
          </div>

          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-5">
            {visibleCourses.map((course) => (
              <CourseCard
                key={course.id}
                title={course.title}
                variant="select"
                onSelect={() => addCourse(semester, course)}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
