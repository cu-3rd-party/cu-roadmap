import { Chip } from "@/shared/ui";

import {
  buildTypeFilters,
  SEMESTER_OPTIONS,
  type CategoryFilterOption,
  type CourseFilterState,
} from "../model";

import { CourseSearchFilter } from "./CourseSearchFilter";
import { FilterCard } from "./FilterCard";
import { ChipSkeletonRow } from "./FilterSkeleton";

const TYPE_OPTIONS = buildTypeFilters();

interface CourseFiltersProps {
  value: CourseFilterState;
  onToggleType: (type: string) => void;
  onToggleSemester: (semester: string) => void;
  onToggleCategory: (id: string) => void;
  onSearchChange: (search: string) => void;
  categories: CategoryFilterOption[];
  types?: { id: string; label: string }[];
  semesters?: readonly string[];
  loading?: boolean;
}

export const CourseFilters = ({
  value,
  onToggleType,
  onToggleSemester,
  onToggleCategory,
  onSearchChange,
  categories,
  types = TYPE_OPTIONS,
  semesters = SEMESTER_OPTIONS,
  loading = false,
}: CourseFiltersProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="grid gap-1 sm:grid-cols-2">
        <FilterCard label="Рекомендованный семестр">
          {loading ? (
            <ChipSkeletonRow widths={[32, 32, 32, 32, 32, 32, 32, 32]} />
          ) : (
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
          )}
        </FilterCard>

        <FilterCard label="Тип курса">
          {loading ? (
            <ChipSkeletonRow widths={[80, 96, 72]} />
          ) : (
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <Chip
                  variant="action"
                  key={type.id}
                  size="xs"
                  active={value.types.includes(type.id)}
                  onClick={() => onToggleType(type.id)}
                >
                  {type.label}
                </Chip>
              ))}
            </div>
          )}
        </FilterCard>
      </div>

      <FilterCard>
        <CourseSearchFilter
          categories={categories}
          search={value.search}
          selectedCategories={value.categories}
          loading={loading}
          onSearchChange={onSearchChange}
          onToggleCategory={onToggleCategory}
        />
      </FilterCard>
    </div>
  );
};
