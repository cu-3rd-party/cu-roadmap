import type { ReactNode } from "react";

import { useMediaQuery } from "@/shared/lib";
import { Chip, ScrollRail } from "@/shared/ui";

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
  const isMobile = useMediaQuery("sm");

  if (loading) {
    return <ChipSkeletonRow widths={[48, 72, 80, 96, 112, 72]} />;
  }

  // On mobile the chips scroll horizontally in a single row (ScrollRail); on
  // desktop there is room to wrap onto multiple lines.
  const wrap = (children: ReactNode) =>
    isMobile ? (
      <ScrollRail>{children}</ScrollRail>
    ) : (
      <div className="flex flex-wrap gap-2">{children}</div>
    );

  return (
    <div className="flex flex-col gap-2">
      {wrap(
        FILTER_GROUPS.map((option) => (
          <Chip
            variant="action"
            key={option.id}
            size="xs"
            active={group === option.id}
            onClick={() => onGroupChange(option.id)}
          >
            {option.label}
          </Chip>
        )),
      )}

      {subOptions.length > 0 &&
        wrap(
          subOptions.map((option) => (
            <Chip
              variant="action"
              key={option.id}
              size="xs"
              active={sub === option.id}
              onClick={() => onSubChange(option.id)}
            >
              {option.label}
            </Chip>
          )),
        )}
    </div>
  );
};
