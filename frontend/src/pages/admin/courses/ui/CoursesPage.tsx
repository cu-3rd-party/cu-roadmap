import { BookOpen, Plus } from "lucide-react";
import { useState } from "react";

import {
  ClearChip,
  CourseSearchFilter,
  FilterCard,
} from "@/features/course-filters";
import { ADMISSION_YEARS, type AdmissionYear } from "@/shared/constants";
import { useMediaQuery } from "@/shared/lib";
import type { CourseCategory } from "@/shared/model";
import { Button, Chip, CollapsiblePanel, Panel } from "@/shared/ui";

import { CATEGORY_FILTER_LABELS, CATEGORY_FILTER_OPTIONS } from "../model";

const toggle = <T,>(list: T[], value: T): T[] =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];

export default function CoursesPage() {
  const isMobile = useMediaQuery("md");

  /* Shell only: the chips and the search box own their state so the panel feels
     alive, but nothing reads it yet — the query wiring lands with the course
     list and the add/delete flow. */
  const [years, setYears] = useState<AdmissionYear[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [search, setSearch] = useState("");

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2">
      <Panel className="flex flex-col gap-4 px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col gap-3 px-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Chip variant="blue" size={isMobile ? "xs" : "sm"}>
                <BookOpen />
              </Chip>
              <h1 className="text-2xl font-bold text-fg-primary">Курсы</h1>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={isMobile ? <Plus /> : undefined}
              aria-label="Добавить курс"
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
    </div>
  );
}
