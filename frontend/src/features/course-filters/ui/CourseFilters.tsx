import { Chip } from "@/shared/ui/kit/chip";

import {
  CATEGORY_FILTERS,
  MAJOR_OPTIONS,
  YEAR_OPTIONS,
  type CategoryFilterOption,
  type CourseFilterState,
} from "../model/options";

import { CourseSearchFilter } from "./CourseSearchFilter";
import { FilterCard } from "./FilterCard";

interface CourseFiltersProps {
  value: CourseFilterState;
  onToggleYear: (year: string) => void;
  onToggleMajor: (major: string) => void;
  onToggleCategory: (id: string) => void;
  onSearchChange: (search: string) => void;
  years?: readonly string[];
  majors?: readonly string[];
  categories?: CategoryFilterOption[];
}

export const CourseFilters = ({
  value,
  onToggleYear,
  onToggleMajor,
  onToggleCategory,
  onSearchChange,
  years = YEAR_OPTIONS,
  majors = MAJOR_OPTIONS,
  categories = CATEGORY_FILTERS,
}: CourseFiltersProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="grid gap-1 sm:grid-cols-2">
        <FilterCard label="Год поступления">
          <div className="flex flex-wrap gap-2">
            {years.map((year) => (
              <Chip
                variant="action"
                key={year}
                size="xs"
                active={value.years.includes(year)}
                onClick={() => onToggleYear(year)}
              >
                {year}
              </Chip>
            ))}
          </div>
        </FilterCard>

        <FilterCard label="Мейджор">
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
        </FilterCard>
      </div>

      <FilterCard>
        <CourseSearchFilter
          categories={categories}
          search={value.search}
          selectedCategories={value.categories}
          onSearchChange={onSearchChange}
          onToggleCategory={onToggleCategory}
        />
      </FilterCard>
    </div>
  );
};
