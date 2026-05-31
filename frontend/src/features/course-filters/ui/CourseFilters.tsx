import { Chip } from "@/shared/ui/kit/chip";

import {
  ACTIVE_MAJOR,
  CATEGORY_FILTERS,
  MAJOR_OPTIONS,
  YEAR_OPTIONS,
  type CategoryFilterOption,
} from "../model/options";

import { CourseSearchFilter } from "./CourseSearchFilter";
import { FilterCard } from "./FilterCard";

interface CourseFiltersProps {
  years?: readonly string[];
  majors?: readonly string[];
  activeMajor?: string;
  categories?: CategoryFilterOption[];
}

export const CourseFilters = ({
  years = YEAR_OPTIONS,
  majors = MAJOR_OPTIONS,
  activeMajor = ACTIVE_MAJOR,
  categories = CATEGORY_FILTERS,
}: CourseFiltersProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="grid gap-1 sm:grid-cols-2">
        <FilterCard label="Год поступления">
          <div className="flex flex-wrap gap-2">
            {years.map((year) => (
              <Chip variant="action" key={year} size="xs">
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
                active={major === activeMajor}
              >
                {major}
              </Chip>
            ))}
          </div>
        </FilterCard>
      </div>

      <FilterCard>
        <CourseSearchFilter categories={categories} />
      </FilterCard>
    </div>
  );
};
