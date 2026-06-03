import { Compass } from "lucide-react";
import { useMemo } from "react";

import { buildCourseTitleMap, useCoursesQuery } from "@/entities/course";
import { useMajorsQuery } from "@/entities/major";
import { CourseFilters } from "@/features/course-filters";
import { useSettingsStore } from "@/features/settings";
import { Chip } from "@/shared/ui";
import { CollapsiblePanel, Panel } from "@/shared/ui/panel";
import { CoursesSection } from "@/widgets/CoursesSection";

import { buildCatalogCategories } from "./lib";
import { categoryOptionsWithCounts, filterCatalog } from "./model/filter";
import { useCatalogFiltersStore } from "./model/store";

const CatalogPage = () => {
  const { admissionYear } = useSettingsStore();
  const { filters, toggleType, toggleMajor, toggleCategory, setSearch } =
    useCatalogFiltersStore();

  const { data: courses, isLoading, isError } = useCoursesQuery(admissionYear);
  const { data: majors } = useMajorsQuery(admissionYear);

  const categories = useMemo(
    () => buildCatalogCategories(courses ?? []),
    [courses],
  );

  const categoryOptions = useMemo(
    () => categoryOptionsWithCounts(categories, filters),
    [categories, filters],
  );

  const visibleCategories = useMemo(
    () => filterCatalog(categories, filters),
    [categories, filters],
  );

  const majorTitles = useMemo(
    () => majors?.map((major) => major.title) ?? [],
    [majors],
  );

  const titleMap = useMemo(() => buildCourseTitleMap(courses ?? []), [courses]);

  const majorTitleMap = useMemo(
    () => new Map((majors ?? []).map((major) => [major.id, major.title])),
    [majors],
  );

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-1">
      <Panel className="flex flex-col gap-4">
        <div className="mb-4 flex items-center gap-4 px-1">
          <Chip variant="blue" size="sm">
            <Compass />
          </Chip>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-fg-primary">
              Каталог курсов
            </h1>
            <div className="text-sm text-fg-secondary flex flex-col gap-2">
              <p>Исследуй все доступные тебе курсы!</p>
              <p>
                На карточки можно кликать, чтобы получить дополнительную
                информацию
              </p>
            </div>
          </div>
        </div>

        <CollapsiblePanel title="Фильтры">
          <CourseFilters
            value={filters}
            majors={majorTitles}
            categories={categoryOptions}
            onToggleType={toggleType}
            onToggleMajor={toggleMajor}
            onToggleCategory={toggleCategory}
            onSearchChange={setSearch}
          />
        </CollapsiblePanel>
      </Panel>

      {isLoading && (
        <Panel>
          <p className="px-1 text-sm text-fg-secondary">Загрузка курсов…</p>
        </Panel>
      )}

      {isError && (
        <Panel>
          <p className="px-1 text-sm text-fg-negative">
            Не удалось загрузить курсы. Попробуйте обновить страницу.
          </p>
        </Panel>
      )}

      {!isLoading &&
        !isError &&
        visibleCategories.map((category) => (
          <CoursesSection
            key={category.id}
            title={category.title}
            courses={category.courses}
            titleMap={titleMap}
            majorTitleMap={majorTitleMap}
          />
        ))}
    </div>
  );
};

export default CatalogPage;
