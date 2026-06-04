import { Chip } from "@/shared/ui";

import {
  buildCategoryFilters,
  buildTypeFilters,
  MAJOR_OPTIONS,
  type CategoryFilterOption,
  type CourseFilterState,
} from "../model";

import { CourseSearchFilter } from "./CourseSearchFilter";
import { FilterCard } from "./FilterCard";
import { ChipSkeletonRow } from "./FilterSkeleton";

const TYPE_OPTIONS = buildTypeFilters();
const CATEGORY_OPTIONS = buildCategoryFilters();

interface CourseFiltersProps {
  value: CourseFilterState;
  onToggleType: (type: string) => void;
  onToggleMajor: (major: string) => void;
  onToggleCategory: (id: string) => void;
  onSearchChange: (search: string) => void;
  types?: { id: string; label: string }[];
  majors?: readonly string[];
  categories?: CategoryFilterOption[];
  loading?: boolean;
}

export const CourseFilters = ({
  value,
  onToggleType,
  onToggleMajor,
  onToggleCategory,
  onSearchChange,
  types = TYPE_OPTIONS,
  majors = MAJOR_OPTIONS,
  categories = CATEGORY_OPTIONS,
  loading = false,
}: CourseFiltersProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="grid gap-1 sm:grid-cols-2">
        <FilterCard label="Мейджор">
          {loading ? (
            <ChipSkeletonRow widths={[72, 104, 88, 64, 96]} />
          ) : (
            <div className="flex flex-wrap gap-2">
              {majors.map((major) => (
                <Chip
                  variant="action"
                  key={major}
                  size="xs"
                  active={value.majors.includes(major)}
                  onClick={() => onToggleMajor(major)}
                >
                  {major}
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
