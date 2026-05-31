import { cn } from "@/shared/lib/cn";

import { REQUISITE_LINK_ICON, REQUISITE_STATUS_ICONS } from "../lib";
import type { RequisiteItem } from "../model/details";

interface RequisiteListProps {
  items: RequisiteItem[];
  variant: "prereq" | "link";
}

export const RequisiteList = ({
  items,
  variant,
}: RequisiteListProps) => {
  if (items.length === 0) {
    return <p className="text-fg-primary">Нет</p>;
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const Icon =
          variant === "prereq"
            ? REQUISITE_STATUS_ICONS[item.locked ? "locked" : "unlocked"]
            : REQUISITE_LINK_ICON;
        const iconColor =
          variant === "prereq" && item.locked
            ? "text-fg-negative"
            : "text-fg-positive";

        return (
          <li
            key={item.title}
            className="flex items-center gap-2 text-fg-primary"
          >
            <Icon className={cn("size-4 shrink-0", iconColor)} />
            {item.title}
          </li>
        );
      })}
    </ul>
  );
};
