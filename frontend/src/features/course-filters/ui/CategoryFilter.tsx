import { Chip } from "@/shared/ui";

import { FILTER_GROUPS, type FilterGroup } from "../model";

import { ChipSkeletonRow } from "./FilterSkeleton";

interface CategoryFilterProps {
  group: FilterGroup;
  sub: string;
  subOptions: { id: string; label: string }[];
  onGroupChange: (group: FilterGroup) => void;
  onSubChange: (sub: string) => void;
  loading?: boolean;
}

// Two single-select chip rows: the top-level group and its contextual sub-row.
export const CategoryFilter = ({
  group,
  sub,
  subOptions,
  onGroupChange,
  onSubChange,
  loading = false,
}: CategoryFilterProps) => {
  if (loading) {
    return <ChipSkeletonRow widths={[48, 72, 80, 96, 112, 72]} />;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {FILTER_GROUPS.map((option) => (
          <Chip
            variant="action"
            key={option.id}
            size="xs"
            active={group === option.id}
            onClick={() => onGroupChange(option.id)}
          >
            {option.label}
          </Chip>
        ))}
      </div>

      {subOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subOptions.map((option) => (
            <Chip
              variant="action"
              key={option.id}
              size="xs"
              active={sub === option.id}
              onClick={() => onSubChange(option.id)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
};
