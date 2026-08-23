import { BookOpen, Loader2, Plus } from "lucide-react";
import { useState } from "react";

import type { Course } from "@/entities/course";
import {
  AdminCourseGrid,
  CATEGORY_FILTER_LABELS,
  CATEGORY_FILTER_OPTIONS,
  useAdminCoursesQuery,
  useCreateCourseMutation,
  useDeleteCourseMutation,
} from "@/features/admin-courses";
import {
  ClearChip,
  CourseSearchFilter,
  FilterCard,
} from "@/features/course-filters";
import { ADMISSION_YEARS, type AdmissionYear } from "@/shared/constants";
import { useDebouncedValue, useMediaQuery } from "@/shared/lib";
import type { CourseCategory } from "@/shared/model";
import {
  Button,
  Chip,
  CollapsiblePanel,
  ConfirmModal,
  Panel,
} from "@/shared/ui";

const SEARCH_DEBOUNCE_MS = 300;

const toggle = <T,>(list: T[], value: T): T[] =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];

const CoursesPage = () => {
  const isMobile = useMediaQuery("md");

  const [years, setYears] = useState<AdmissionYear[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [search, setSearch] = useState("");

  /* Filtering runs server-side, so every keystroke would be a request. The
     chips are cheap enough to send straight through. */
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);

  const {
    data: courses,
    isLoading,
    isFetching,
    error,
  } = useAdminCoursesQuery({
    cohortYears: years,
    categories,
    title: debouncedSearch,
  });

  /* Covers the debounce gap as well as the request: between a keystroke and the
     refetch nothing is in flight, but the grid is already stale. */
  const filtering = isFetching || search !== debouncedSearch;

  const [pendingDelete, setPendingDelete] = useState<Course | null>(null);
  const { mutate: removeCourse } = useDeleteCourseMutation();
  const { mutate: addCourse, isPending: creating } = useCreateCourseMutation();

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2">
      <Panel className="flex flex-col gap-4 px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col gap-3 px-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Chip variant="blue" size={isMobile ? "xs" : "sm"}>
                <BookOpen />
              </Chip>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-fg-primary">Курсы</h1>
                {filtering && (
                  <Loader2
                    className="mt-0.5 size-4 animate-spin text-fg-secondary"
                    aria-label="Загрузка…"
                  />
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={isMobile ? <Plus /> : undefined}
              aria-label="Добавить курс"
              loading={creating}
              onClick={() => addCourse()}
            >
              {isMobile ? undefined : "Добавить курс"}
            </Button>
          </div>

          <div className="flex flex-col gap-1 text-sm text-fg-secondary">
            <p>Управление каталогом курсов университета.</p>
            <p>
              Здесь можно добавить новый курс, удалить неактуальный или изменить
              существующий
            </p>
          </div>
        </div>

        <CollapsiblePanel title="Фильтры">
          <div className="flex flex-col gap-1">
            <div className="grid gap-1 sm:grid-cols-2">
              <FilterCard label="Год поступления">
                <div className="flex flex-wrap gap-2">
                  {ADMISSION_YEARS.map((year) => (
                    <Chip
                      variant="action"
                      key={year}
                      size="xs"
                      active={years.includes(year)}
                      onClick={() => setYears(toggle(years, year))}
                    >
                      {year}
                    </Chip>
                  ))}
                  {years.length > 0 && (
                    <ClearChip onClick={() => setYears([])} />
                  )}
                </div>
              </FilterCard>

              <FilterCard label="Тип">
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_FILTER_OPTIONS.map((category) => (
                    <Chip
                      variant="action"
                      key={category}
                      size="xs"
                      active={categories.includes(category)}
                      onClick={() =>
                        setCategories(toggle(categories, category))
                      }
                    >
                      {CATEGORY_FILTER_LABELS[category]}
                    </Chip>
                  ))}
                  {categories.length > 0 && (
                    <ClearChip onClick={() => setCategories([])} />
                  )}
                </div>
              </FilterCard>
            </div>

            <FilterCard>
              <CourseSearchFilter search={search} onSearchChange={setSearch} />
            </FilterCard>
          </div>
        </CollapsiblePanel>
      </Panel>

      <AdminCourseGrid
        courses={courses}
        isLoading={isLoading}
        error={error}
        onDelete={setPendingDelete}
      />

      <ConfirmModal
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Удалить курс"
        onConfirm={() => pendingDelete && removeCourse(pendingDelete.id)}
      />
    </div>
  );
};

export default CoursesPage;
