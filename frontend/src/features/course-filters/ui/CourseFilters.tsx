import { Chip } from "@/shared/ui";

import {
  SEMESTER_OPTIONS,
  WORKLOAD_OPTIONS,
  type CourseFilterState,
  type FilterGroup,
} from "../model";

import { CategoryFilter } from "./CategoryFilter";
import { CourseSearchFilter } from "./CourseSearchFilter";
import { FilterCard } from "./FilterCard";

interface CourseFiltersProps {
  value: CourseFilterState;
  subOptions: { id: string; label: string }[];
  onToggleAvailableSemester: (semester: string) => void;
  onToggleSemester: (semester: string) => void;
  onToggleWorkload: (workload: string) => void;
  onGroupChange: (group: FilterGroup) => void;
  onSubChange: (sub: string) => void;
  onSearchChange: (search: string) => void;
  semesters?: readonly string[];
  loading?: boolean;
}

export const CourseFilters = ({
  value,
  subOptions,
  onToggleAvailableSemester,
  onToggleSemester,
  onToggleWorkload,
  onGroupChange,
  onSubChange,
  onSearchChange,
  semesters = SEMESTER_OPTIONS,
  loading = false,
}: CourseFiltersProps) => {
  return (
    <div className="flex flex-col gap-1">
      {/* Static options — rendered immediately, no loading skeleton. */}
      <div className="grid gap-1 sm:grid-cols-3">
        <FilterCard label="Доступные семестры">
          <div className="flex flex-wrap gap-2">
            {semesters.map((semester) => (
              <Chip
                variant="action"
                key={semester}
                size="xs"
                active={value.availableSemesters.includes(semester)}
                onClick={() => onToggleAvailableSemester(semester)}
                className="rounded-full size-8"
              >
                {semester}
              </Chip>
            ))}
          </div>
        </FilterCard>

        <FilterCard label="Рекомендованный семестр">
          <div className="flex flex-wrap gap-2">
            {semesters.map((semester) => (
              <Chip
                variant="action"
                key={semester}
                size="xs"
                active={value.semesters.includes(semester)}
                onClick={() => onToggleSemester(semester)}
                className="rounded-full size-8"
              >
                {semester}
              </Chip>
            ))}
          </div>
        </FilterCard>

        <FilterCard label="Нагрузка в парах в неделю">
          <div className="flex flex-wrap gap-2">
            {WORKLOAD_OPTIONS.map((workload) => (
              <Chip
                variant="action"
                key={workload}
                size="xs"
                active={value.workload.includes(workload)}
                onClick={() => onToggleWorkload(workload)}
                className="rounded-full size-8"
              >
                {workload === "4" ? "4+" : workload}
              </Chip>
            ))}
          </div>
        </FilterCard>
      </div>

      <FilterCard>
        <CourseSearchFilter
          search={value.search}
          loading={loading}
          onSearchChange={onSearchChange}
        />
        <CategoryFilter
          group={value.group}
          sub={value.sub}
          subOptions={subOptions}
          loading={loading}
          onGroupChange={onGroupChange}
          onSubChange={onSubChange}
        />
      </FilterCard>
    </div>
  );
};
