import { X } from "lucide-react";

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
  onClearAvailableSemesters: () => void;
  onClearSemesters: () => void;
  onClearWorkload: () => void;
  onGroupChange: (group: FilterGroup) => void;
  onSubChange: (sub: string) => void;
  onSearchChange: (search: string) => void;
  semesters?: readonly string[];
  loading?: boolean;
}

// Round pale-red button shown at the end of a card's chip row to clear that
// card's selection. Sized to match the option chips (`rounded-full size-8`).
const ClearChip = ({ onClick }: { onClick: () => void }) => (
  <Chip
    variant="red"
    size="xs"
    onClick={onClick}
    aria-label="Очистить"
    className="rounded-full size-8 cursor-pointer hover:opacity-80 hover:text-fg-negative"
  >
    <X />
  </Chip>
);

export const CourseFilters = ({
  value,
  subOptions,
  onToggleAvailableSemester,
  onToggleSemester,
  onToggleWorkload,
  onClearAvailableSemesters,
  onClearSemesters,
  onClearWorkload,
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
        <FilterCard
          label="Доступные семестры"
          hint="Семестры, в которые курс можно взять"
        >
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
            {value.availableSemesters.length > 0 && (
              <ClearChip onClick={onClearAvailableSemesters} />
            )}
          </div>
        </FilterCard>

        <FilterCard
          label="Рекомендованный семестр"
          hint="Семестр, в который командой методистов рекомендуется (но не всегда обязательно) курс пройти"
        >
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
            {value.semesters.length > 0 && (
              <ClearChip onClick={onClearSemesters} />
            )}
          </div>
        </FilterCard>

        <FilterCard
          label="Нагрузка в парах в неделю"
          hint="Сколько пар у курса в неделю (для курсов со сдвоенными парами и другими видами проведения считается среднее количество в неделю)"
        >
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
            {value.workload.length > 0 && (
              <ClearChip onClick={onClearWorkload} />
            )}
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
