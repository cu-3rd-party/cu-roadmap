import { PagePlaceholder } from "@/shared/ui";

/* Base shell only — the box requirements editor lands here, and the route
   already carries the `:groupId` it will read. Deliberately does not fetch the
   group yet: the real editor decides what it needs, and a query added now would
   only be rewritten. */
const GroupEditPage = () => {
  return (
    <PagePlaceholder
      title="Коробка"
      description="Редактор требований коробки скоро появится."
    />
  );
};

export default GroupEditPage;
