import { cn, pluralizeRu } from "@/shared/lib";
import { Badge } from "@/shared/ui/kit";

import { groupRuleLabel } from "../lib";
import type { DisciplineGroup } from "../model/types";

interface DisciplineGroupBadgesProps {
  group: DisciplineGroup;
  className?: string;
}

/* Mirrors AdminCourseBadges' green/orange pairing so the Курсы and Коробки tabs
   of the requisite picker read as one grid: how many things are in the box, and
   the rule that picks between them. */
export const DisciplineGroupBadges = ({
  group,
  className,
}: DisciplineGroupBadgesProps) => {
  const count = group.expression.children.length;
  const rule = groupRuleLabel(group.expression);

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      <Badge variant="green" size="3xs">
        {count} {pluralizeRu(count, ["объект", "объекта", "объектов"])}
      </Badge>
      {rule && (
        <Badge variant="orange" size="3xs">
          {rule}
        </Badge>
      )}
    </div>
  );
};
