import { cn } from "@/shared/lib/cn";

import { REQUISITE_ICONS, RequisiteType } from "../lib";
import type { RequisiteItem } from "../model/details";

interface RequisiteListProps {
  type: RequisiteType;
  items: RequisiteItem[];
}

export const RequisiteList = ({ type, items }: RequisiteListProps) => {
  if (items.length === 0) {
    return <p className="text-fg-primary">Нет</p>;
  }

  const Icon = REQUISITE_ICONS[type];

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-2 text-fg-primary">
          <Icon className={cn("size-4 shrink-0")} />
          {item.title}
        </li>
      ))}
    </ul>
  );
};
