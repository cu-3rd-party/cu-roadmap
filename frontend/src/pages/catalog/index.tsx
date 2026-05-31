import { Compass } from "lucide-react";

import { CourseFilters } from "@/features/course-filters";
import { Chip } from "@/shared/ui/kit/chip";
import { CollapsiblePanel, Panel } from "@/shared/ui/panel";
import { CoursesSection } from "@/widgets/CoursesSection";

import { CATALOG_CATEGORIES } from "./model/mock";

const CatalogPage = () => {
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
            <p className="text-sm text-fg-secondary">
              Выбери мейджор и исследуй все доступные курсы
            </p>
          </div>
        </div>

        <CollapsiblePanel title="Фильтры">
          <CourseFilters />
        </CollapsiblePanel>
      </Panel>

      {CATALOG_CATEGORIES.map((category) => (
        <CoursesSection
          key={category.id}
          title={category.title}
          selected={category.selected}
          total={category.total}
          courses={category.courses}
        />
      ))}
    </div>
  );
};

export default CatalogPage;
