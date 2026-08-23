import { useCallback, useDeferredValue, useMemo } from "react";

import { CourseSelectCard, type Course } from "@/entities/course";
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
import { SelectGridModal } from "@/shared/ui";

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

  return (
    <SelectGridModal
      open={open}
      onOpenChange={onOpenChange}
      title="Доступные курсы"
      mobileTitle={
        <>
          <span className="block">Доступные курсы</span>
          <span className="block">{`(${semester} семестр)`}</span>
        </>
      }
      imageSrc="/character3.png"
      imageAlt="Персонаж 3"
      controls={
        <>
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
        </>
      }
      isLoading={isLoading}
      isError={isError}
      isEmpty={visibleCourses.length === 0}
      emptyText="Нет курсов, доступных в этом семестре."
    >
      {visibleCourses.map((course) => {
        const selectedSemester = semesterByCourseId.get(
          course.id,
        ) as SemesterNumber;
        const isSelected = selectedSemester !== undefined;
        const isFixed = fixedCourseIds.has(course.id);
        const isOtherSemester = isSelected && selectedSemester !== semester;
        // dimmed - non-clickable: pinned, or placed in another semester
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
    </SelectGridModal>
  );
};
