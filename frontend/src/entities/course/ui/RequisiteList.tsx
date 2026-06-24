import { cn } from "@/shared/lib/cn";
import type { UUID } from "@/shared/model";

import type { PrerequisiteGroupItem, RequisiteItem } from "../model";

interface RequisiteNav {
  // Navigate the drawer to the given course id.
  onNavigate: (id: UUID) => void;
  navigableIds: Set<UUID>;
}

type RequisiteListProps = RequisiteNav &
  (
    | { type: "pre"; groups: PrerequisiteGroupItem[] }
    | { type: "post" | "co"; items: RequisiteItem[] }
  );

const RequisiteRow = ({
  item,
  onNavigate,
  navigableIds,
}: { item: RequisiteItem } & RequisiteNav) => {
  if (!navigableIds.has(item.id)) {
    return <li className="text-fg-primary">{item.title}</li>;
  }
  return (
    <li className="text-fg-primary">
      <button
        type="button"
        onClick={() => onNavigate(item.id)}
        className={cn(
          "cursor-pointer text-left text-accent hover:underline",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        )}
      >
        {item.title}
      </button>
    </li>
  );
};

export const RequisiteList = ({
  onNavigate,
  navigableIds,
  ...props
}: RequisiteListProps) => {
  const nav = { onNavigate, navigableIds };

  if (props.type === "pre") {
    const { groups } = props;

    if (groups.length === 0) {
      return <p className="text-fg-primary">Нет</p>;
    }

    return (
      <div className="space-y-2.5">
        {groups.map((group) =>
          group.prerequisites.length === 1 ? (
            <ul className="list-disc pl-5" key={group.groupId}>
              <RequisiteRow item={group.prerequisites[0]} {...nav} />
            </ul>
          ) : (
            <div key={group.groupId} className="space-y-1">
              <p className="pl-1 text-xs text-fg-tertiary">Один из:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                {group.prerequisites.map((item) => (
                  <RequisiteRow key={item.id} item={item} {...nav} />
                ))}
              </ul>
            </div>
          ),
        )}
      </div>
    );
  }

  const { items } = props;

  if (items.length === 0) {
    return <p className="text-fg-primary">Нет</p>;
  }

  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item) => (
        <RequisiteRow key={item.id} item={item} {...nav} />
      ))}
    </ul>
  );
};
