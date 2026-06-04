import { Search } from "lucide-react";
import { useState } from "react";

import { Chip, Counter, Input, Skeleton } from "@/shared/ui";

import { buildCategoryFilters, type CategoryFilterOption } from "../model";

import { ChipSkeletonRow } from "./FilterSkeleton";

const CATEGORY_OPTIONS = buildCategoryFilters();

interface CourseSearchFilterProps {
  categories?: CategoryFilterOption[];
  search?: string;
  onSearchChange?: (search: string) => void;
  selectedCategories?: string[];
  onToggleCategory?: (id: string) => void;
  loading?: boolean;
}

export const CourseSearchFilter = ({
  categories = CATEGORY_OPTIONS,
  search,
  onSearchChange,
  selectedCategories,
  onToggleCategory,
  loading = false,
}: CourseSearchFilterProps) => {
  const [localSearch, setLocalSearch] = useState("");
  const [localSelected, setLocalSelected] = useState<string[]>([]);

  const searchValue = search ?? localSearch;
  const selected = selectedCategories ?? localSelected;

  const handleSearchChange = (value: string) =>
    onSearchChange ? onSearchChange(value) : setLocalSearch(value);

  const handleToggleCategory = (id: string) =>
    onToggleCategory
      ? onToggleCategory(id)
      : setLocalSelected((prev) =>
          prev.includes(id)
            ? prev.filter((item) => item !== id)
            : [...prev, id],
        );

  if (loading) {
    return (
      <>
        <Skeleton className="h-10 w-full rounded-xl" />
        <ChipSkeletonRow widths={[120, 96, 140, 88, 112, 104]} />
      </>
    );
  }

  return (
    <>
      <Input
        icon={<Search />}
        placeholder="Поиск по названию или описанию"
        value={searchValue}
        onChange={(event) => handleSearchChange(event.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isSelected = selected.includes(category.id);
          return (
            <Chip
              key={category.id}
              variant="counter"
              size="xs"
              active={isSelected}
              onClick={() => handleToggleCategory(category.id)}
            >
              {category.label}
              {category.count !== undefined && (
                <Counter
                  variant={isSelected ? "positive" : "primary"}
                  size="xxs"
                >
                  {category.count}
                </Counter>
              )}
            </Chip>
          );
        })}
      </div>
    </>
  );
};
