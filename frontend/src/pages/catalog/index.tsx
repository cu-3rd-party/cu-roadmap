import { Compass } from "lucide-react";
import { useMemo } from "react";

import { useCoursesQuery } from "@/entities/course";
import { useMajorsQuery } from "@/entities/major";
import { useSpecializationsQuery } from "@/entities/specialization";
import {
  buildCategoryFilters,
  buildSubOptions,
  CourseFilters,
} from "@/features/course-filters";
import { useSettingsStore } from "@/features/settings";
import { useMediaQuery } from "@/shared/lib";
import { Chip, CollapsiblePanel, Panel } from "@/shared/ui";
import {
  CoursesSection,
  CoursesSectionSkeleton,
} from "@/widgets/CoursesSection";

import { buildCatalogCategories } from "./lib";
import {
  optionDescription,
  useCatalogFiltersStore,
  filterCatalog,
} from "./model";

const CatalogPage = () => {
  const isMobile = useMediaQuery("md");
  const { admissionYear, majorId } = useSettingsStore();
  const {
    filters,
    toggleAvailableSemester,
    toggleSemester,
    toggleWorkload,
    setGroup,
    setSub,
    setSearch,
  } = useCatalogFiltersStore();

  const {
    data: courses,
    isLoading: coursesLoading,
    isError,
  } = useCoursesQuery(admissionYear, majorId);

  const { data: majors } = useMajorsQuery(admissionYear);
  const { data: specializations } = useSpecializationsQuery(majorId);

  const majorType = useMemo(
    () => majors?.find((major) => major.id === majorId)?.type ?? null,
    [majors, majorId],
  );

  const options = useMemo(
    () => buildCategoryFilters(majorType, specializations ?? []),
    [majorType, specializations],
  );

  const subOptions = useMemo(
    () => buildSubOptions(filters.group, majorType, specializations ?? []),
    [filters.group, majorType, specializations],
  );

  const categories = useMemo(
    () => buildCatalogCategories(courses ?? [], options),
    [courses, options],
  );

  const visibleCategories = useMemo(
    () => filterCatalog(categories, filters),
    [categories, filters],
  );

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2">
      <Panel className="flex flex-col gap-4 px-2 sm:px-4 lg:px-6">
        <div className="mb-4 flex flex-col gap-3 px-1">
          <div className="flex w-full gap-4 h-10 items-center">
            <Chip variant="blue" size={isMobile ? "xs" : "sm"}>
              <Compass />
            </Chip>
            <h1 className="text-2xl font-bold text-fg-primary">Каталог</h1>
          </div>

          <div className="flex flex-col gap-1">
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
            subOptions={subOptions}
            loading={coursesLoading}
            onToggleAvailableSemester={toggleAvailableSemester}
            onToggleSemester={toggleSemester}
            onToggleWorkload={toggleWorkload}
            onGroupChange={setGroup}
            onSubChange={setSub}
            onSearchChange={setSearch}
          />
        </CollapsiblePanel>
      </Panel>

      {coursesLoading && (
        <>
          <CoursesSectionSkeleton cards={15} />
        </>
      )}

      {isError && (
        <Panel>
          <p className="px-1 text-sm text-fg-negative">
            Не удалось загрузить курсы. Попробуйте обновить страницу.
          </p>
        </Panel>
      )}

      {!coursesLoading &&
        !isError &&
        visibleCategories.map((category) => (
          <CoursesSection
            key={category.option.id}
            title={category.option.label}
            courses={category.courses}
            panelTitle={optionDescription(category.option)}
          />
        ))}
    </div>
  );
};

export default CatalogPage;
