import { useDeferredValue, useEffect, useMemo, useState } from "react";

import {
  DisciplineGroupBadges,
  useDisciplineGroupsQuery,
} from "@/entities/disciplineGroup";
import { CourseSearchFilter } from "@/features/course-filters";
import type { UUID } from "@/shared/model";
import {
  SelectGridModal,
  SelectTile,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared/ui";

import {
  courseKey,
  filterCoursesBySearch,
  filterGroupsBySearch,
  groupKey,
  useAdminCoursesQuery,
  type RequisiteKey,
} from "../model";

import { AdminCourseBadges } from "./AdminCourseBadges";

type RequisiteTab = "courses" | "groups";

interface RequisiteSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /* The course being edited — never offered as its own requisite. */
  excludeCourseId?: UUID;
  selectedKeys: ReadonlySet<RequisiteKey>;
  onToggle: (key: RequisiteKey) => void;
}

/* The planner's course picker, reshaped for the admin course editor: same shell,
   same tiles, but the two category chip rows are replaced by a Курсы/Коробки
   switch. Picking is visual only — it toggles a border and never closes. */
export const RequisiteSelectModal = ({
  open,
  onOpenChange,
  excludeCourseId,
  selectedKeys,
  onToggle,
}: RequisiteSelectModalProps) => {
  const [tab, setTab] = useState<RequisiteTab>("courses");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  /* The modal stays mounted while closed, so reset rather than relying on
     unmount — otherwise reopening shows the previous search. */
  useEffect(() => {
    if (!open) {
      setTab("courses");
      setSearch("");
    }
  }, [open]);

  /* Same query key the page already uses for its title map, so react-query
     serves this from cache instead of refetching. */
  const {
    data: courses,
    isLoading: coursesLoading,
    isError: coursesError,
  } = useAdminCoursesQuery({});

  const {
    data: groups,
    isLoading: groupsLoading,
    isError: groupsError,
  } = useDisciplineGroupsQuery({ enabled: open });

  const visibleCourses = useMemo(
    () => filterCoursesBySearch(courses ?? [], deferredSearch, excludeCourseId),
    [courses, deferredSearch, excludeCourseId],
  );

  const visibleGroups = useMemo(
    () => filterGroupsBySearch(groups ?? [], deferredSearch),
    [groups, deferredSearch],
  );

  const showingCourses = tab === "courses";
  const isLoading = showingCourses ? coursesLoading : groupsLoading;
  const isError = showingCourses ? coursesError : groupsError;
  const isEmpty = showingCourses
    ? visibleCourses.length === 0
    : visibleGroups.length === 0;

  return (
    <SelectGridModal
      open={open}
      onOpenChange={onOpenChange}
      title="Доступные курсы/коробки"
      imageSrc="/character3.png"
      imageAlt="Персонаж 3"
      controls={
        <>
          <CourseSearchFilter search={search} onSearchChange={setSearch} />
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as RequisiteTab)}
          >
            {/* Equal-width pills, same as every other segmented row in the app. */}
            <TabsList className="grid grid-flow-col auto-cols-fr">
              <TabsTrigger value="courses">Курсы</TabsTrigger>
              <TabsTrigger value="groups">Коробки</TabsTrigger>
            </TabsList>
          </Tabs>
        </>
      }
      isLoading={isLoading}
      isError={isError}
      errorText="Не удалось загрузить список. Попробуйте обновить страницу."
      isEmpty={isEmpty}
      emptyText={showingCourses ? "Курсы не найдены." : "Коробки не найдены."}
    >
      {showingCourses
        ? visibleCourses.map((course) => {
            const key = courseKey(course.id);
            return (
              <SelectTile
                key={key}
                title={course.title}
                selected={selectedKeys.has(key)}
                onSelect={() => onToggle(key)}
                badges={
                  <AdminCourseBadges course={course} className="mt-auto" />
                }
              />
            );
          })
        : visibleGroups.map((group) => {
            const key = groupKey(group.id);
            return (
              <SelectTile
                key={key}
                title={group.title}
                selected={selectedKeys.has(key)}
                onSelect={() => onToggle(key)}
                badges={
                  <DisciplineGroupBadges group={group} className="mt-auto" />
                }
              />
            );
          })}
    </SelectGridModal>
  );
};
