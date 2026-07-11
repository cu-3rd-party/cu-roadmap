import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { useMediaQuery } from "@/shared/lib";
import { Chip, HintButton, ScrollRail } from "@/shared/ui";

import { FILTER_GROUPS, type FilterGroup } from "../model";

import { ChipSkeletonRow } from "./FilterSkeleton";

interface CategoryFilterProps {
  group: FilterGroup;
  sub: string;
  subOptions: { id: string; label: string }[];
  onGroupChange: (group: FilterGroup) => void;
  onSubChange: (sub: string) => void;
  loading?: boolean;
  // The "Тип курса" label + hint. Hidden in the course-select modal.
  showLabel?: boolean;
}

// Course-type mentions in the hint link to the matching glossary entry, which
// the glossary page opens from the URL hash (e.g. /glossary#core).
const GlossaryLink = ({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) => (
  <Link
    to={`/glossary#${id}`}
    className="underline underline-offset-2 hover:opacity-80"
  >
    {children}
  </Link>
);

const CategoryHint = (
  <div className="flex flex-col gap-2">
    <p>
      <span className="font-medium">Core</span> —{" "}
      <GlossaryLink id="core">Core-курсы</GlossaryLink> вашего мейджора
    </p>
    <p>
      <span className="font-medium">Choice</span> —{" "}
      <GlossaryLink id="choice">Choice-курсы</GlossaryLink> вашего мейджора,
      рассматриваются по специализациям мейджора
    </p>
    <p>
      <GlossaryLink id="electives">
        <span className="font-medium">Факультативы</span>
      </GlossaryLink>{" "}
      — для вашего мейджора будут отображаться полностью необязательные курсы, а
      для других мейджоров — все курсы, так как они не являются обязательными
      (без учёта <GlossaryLink id="minor">миноров</GlossaryLink>)
    </p>
    <p>
      <span className="font-medium">Fundamentals</span> — Обязательные и
      факультативные{" "}
      <GlossaryLink id="fundamentals">Fundamentals-курсы</GlossaryLink>
    </p>
    <p>
      <span className="font-medium">Flex</span> —{" "}
      <GlossaryLink id="stem">STEM-курсы</GlossaryLink> и{" "}
      <GlossaryLink id="soft">Soft-курсы</GlossaryLink>
    </p>
  </div>
);

// Two single-select chip rows: the top-level group and its contextual sub-row.
export const CategoryFilter = ({
  group,
  sub,
  subOptions,
  onGroupChange,
  onSubChange,
  loading = false,
  showLabel = true,
}: CategoryFilterProps) => {
  const isMobile = useMediaQuery("sm");

  const header = showLabel && (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-fg-tertiary">Тип курса</span>
      <HintButton hint={CategoryHint} />
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {header}
        <ChipSkeletonRow widths={[48, 72, 80, 96, 112, 72]} />
      </div>
    );
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
    <div className="flex flex-col gap-3">
      {header}
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
