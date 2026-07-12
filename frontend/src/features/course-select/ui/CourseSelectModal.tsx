import { useCallback, useDeferredValue, useMemo } from "react";

import {
  CourseCardSkeleton,
  CourseSelectCard,
  type Course,
} from "@/entities/course";
import { useMajorsQuery } from "@/entities/major";
import { usePlannerStore } from "@/entities/roadmap";
import { useSpecializationsQuery } from "@/entities/specialization";
import {
  buildCategorySections,
  buildSubOptions,
  CategoryFilter,
  CourseSearchFilter,
} from "@/features/course-filters";
import { useSettingsStore } from "@/features/settings";
import type { SemesterNumber } from "@/shared/constants";
import { cn, useMediaQuery } from "@/shared/lib";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui";
import { RevealImage } from "@/shared/ui/reveal-image";

import { filterAvailableCourses, useCourseSelectFiltersStore } from "../model";

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
  const { filters, setGroup, setSub, setSearch } =
    useCourseSelectFiltersStore();
  const { admissionYear, majorId } = useSettingsStore();
  const isMobile = useMediaQuery("sm");

  const { data: majors } = useMajorsQuery(admissionYear);
  const { data: specializations } = useSpecializationsQuery(majorId);

  const majorType = useMemo(
    () => majors?.find((major) => major.id === majorId)?.type ?? null,
    [majors, majorId],
  );

  const options = useMemo(
    () => buildCategorySections(majorType, specializations ?? []),
    [majorType, specializations],
  );

  const subOptions = useMemo(
    () => buildSubOptions(filters.group, majorType, specializations ?? []),
    [filters.group, majorType, specializations],
  );

  // Selection is tracked across ALL semesters
  const semesterByCourseId = useMemo(() => {
    const map = new Map<string, number>();
    for (const [sem, list] of Object.entries(selections)) {
      for (const c of list) map.set(c.id, Number(sem));
    }
    return map;
  }, [selections]);

  // Fixed (pinned) courses can't be deselected from this modal.
  const fixedCourseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const list of Object.values(selections)) {
      for (const c of list) if (c.fixed) ids.add(c.id);
    }
    return ids;
  }, [selections]);

  // Only courses offered in this semester are selectable from this modal.
  const semesterCourses = useMemo(
    () =>
      courses.filter((course) =>
        course.availableSemesters.includes(semester as SemesterNumber),
      ),
    [courses, semester],
  );

  // Defer only the search term — chip filters apply immediately.
  const deferredSearch = useDeferredValue(filters.search);
  const listFilters = useMemo(
    () => ({ ...filters, search: deferredSearch }),
    [filters, deferredSearch],
  );

  const visibleCourses = useMemo(
    () => filterAvailableCourses(semesterCourses, listFilters, options),
    [semesterCourses, listFilters, options],
  );

  const deferredCourses = visibleCourses;

  // Stable across selection
  const handleCourseSelect = useCallback(
    (course: Course, selectedSemester?: SemesterNumber) => {
      if (selectedSemester !== undefined) {
        // only reached when the course is in this modal's semester
        removeCourse(selectedSemester, course.id);
      } else {
        addCourse(semester, {
          id: course.id,
          title: course.title,
          category: course.category,
          type: course.type,
        });
      }
    },
    [addCourse, removeCourse, semester],
  );

  const content = (
    <>
      <div className="relative z-10 shrink-0 px-3 pb-1">
        <div className="flex flex-col gap-3 rounded-2xl bg-background p-4">
          <CourseSearchFilter
            search={filters.search}
            onSearchChange={setSearch}
          />
          <CategoryFilter
            group={filters.group}
            sub={filters.sub}
            subOptions={subOptions}
            onGroupChange={setGroup}
            onSubChange={setSub}
            showLabel={false}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-expert-blue-pale pl-4 pr-3 pb-3 scrollbar-gutter-stable">
        {isLoading ? (
          <div className="grid gap-1 grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <p className="px-1 py-4 text-sm text-fg-negative">
            Не удалось загрузить курсы. Попробуйте обновить страницу.
          </p>
        ) : deferredCourses.length === 0 ? (
          <div className="flex w-full items-center justify-center rounded-2xl bg-background px-4 py-10 text-sm text-fg-secondary">
            Нет курсов, доступных в этом семестре.
          </div>
        ) : (
          <div className={cn("grid gap-1 grid-cols-2 lg:grid-cols-5")}>
            {deferredCourses.map((course) => {
              const selectedSemester = semesterByCourseId.get(
                course.id,
              ) as SemesterNumber;
              const isSelected = selectedSemester !== undefined;
              const isFixed = fixedCourseIds.has(course.id);
              const isOtherSemester =
                isSelected && selectedSemester !== semester;
              // dimmed + non-clickable: pinned, or placed in another semester
              const isDisabled = isFixed || isOtherSemester;
              return (
                <CourseSelectCard
                  key={course.id}
                  course={course}
                  selected={isSelected}
                  selectedSemester={selectedSemester}
                  disabled={isDisabled}
                  onSelect={handleCourseSelect}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          swipeToClose
          dragHandleOnly
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="flex h-[90vh] flex-col gap-0 overflow-hidden rounded-t-3xl bg-expert-blue-pale p-0"
        >
          <SheetHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
            <SheetTitle className="text-2xl font-bold text-fg-primary">
              <span className="block">Доступные курсы</span>
              <span className="block">{`(${semester} семестр)`}</span>
            </SheetTitle>
            <RevealImage
              src="/character3.png"
              alt="Персонаж 3"
              aria-hidden
              className="pointer-events-none absolute top-6 right-6 h-24 w-auto select-none object-contain"
            />
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex h-[42rem] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-3xl bg-expert-blue-pale p-0 max-w-xl sm:max-w-2xl lg:max-w-5xl xl:max-w-7xl"
      >
        <DialogHeader className="relative shrink-0 px-8 pt-7 pb-4 overflow-hidden">
          <DialogTitle className="text-2xl font-bold text-fg-primary">
            Доступные курсы
          </DialogTitle>
          <RevealImage
            src="/character3.png"
            alt="Персонаж 3"
            aria-hidden
            className="pointer-events-none absolute top-1 right-16 h-32 w-auto select-none object-contain"
          />
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
