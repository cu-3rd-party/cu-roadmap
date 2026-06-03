import { cn } from "@/shared/lib/cn";

import { REQUISITE_LINK_ICON } from "../lib";
import type { RequisiteItem } from "../model/details";

interface RequisiteListProps {
  items: RequisiteItem[];
}

export const RequisiteList = ({ items }: RequisiteListProps) => {
  if (items.length === 0) {
    return <p className="text-fg-primary">Нет</p>;
  }

  const Icon = REQUISITE_LINK_ICON;

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-2 text-fg-primary"
        >
          <Icon className={cn("size-4 shrink-0", "text-fg-positive")} />
          {item.title}
        </li>
      ))}
    </ul>
  );
};
