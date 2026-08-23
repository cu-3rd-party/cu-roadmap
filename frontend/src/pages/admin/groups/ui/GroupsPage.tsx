import { Package, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import {
  filterGroupsBySearch,
  useDisciplineGroupsQuery,
} from "@/entities/disciplineGroup";
import type { DisciplineGroup } from "@/entities/disciplineGroup";
import {
  AdminGroupGrid,
  useCreateDisciplineGroupMutation,
  useDeleteDisciplineGroupMutation,
} from "@/features/admin-groups";
import { CourseSearchFilter, FilterCard } from "@/features/course-filters";
import { useMediaQuery } from "@/shared/lib";
import {
  Button,
  Chip,
  CollapsiblePanel,
  ConfirmModal,
  Panel,
} from "@/shared/ui";

const GroupsPage = () => {
  const isMobile = useMediaQuery("md");

  const [search, setSearch] = useState("");

  const { data: groups, isLoading, error } = useDisciplineGroupsQuery();

  /* Filtering is a useMemo, not a request: GET /discipline-groups takes no query
     params, so the whole list is already here. That is also why there is no
     debounce and no header spinner — unlike the courses screen, nothing is in
     flight between a keystroke and the redrawn grid. */
  const visible = useMemo(
    () => filterGroupsBySearch(groups ?? [], search),
    [groups, search],
  );

  const [pendingDelete, setPendingDelete] = useState<DisciplineGroup | null>(
    null,
  );
  const { mutate: removeGroup } = useDeleteDisciplineGroupMutation();
  const { mutate: addGroup, isPending: creating } =
    useCreateDisciplineGroupMutation();

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2">
      <Panel className="flex flex-col gap-4 px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col gap-3 px-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Chip variant="blue" size={isMobile ? "xs" : "sm"}>
                <Package />
              </Chip>
              <h1 className="text-2xl font-bold text-fg-primary">Коробки</h1>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={isMobile ? <Plus /> : undefined}
              aria-label="Добавить коробку"
              loading={creating}
              onClick={() => addGroup()}
            >
              {isMobile ? undefined : "Добавить коробку"}
            </Button>
          </div>

          <div className="flex flex-col gap-1 text-sm text-fg-secondary">
            <p>Управление коробками и их требованиями.</p>
            <p>
              Коробка собирает курсы в одно требование — либо все сразу, либо
              несколько на выбор
            </p>
          </div>
        </div>

        <CollapsiblePanel title="Фильтры">
          <FilterCard>
            <CourseSearchFilter
              search={search}
              onSearchChange={setSearch}
              placeholder="Поиск по названию"
            />
          </FilterCard>
        </CollapsiblePanel>
      </Panel>

      <AdminGroupGrid
        groups={visible}
        isLoading={isLoading}
        error={error}
        onDelete={setPendingDelete}
      />

      <ConfirmModal
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Удалить коробку"
        onConfirm={() => pendingDelete && removeGroup(pendingDelete.id)}
      />
    </div>
  );
};

export default GroupsPage;
