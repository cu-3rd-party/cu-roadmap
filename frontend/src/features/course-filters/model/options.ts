import {
  categorySlugToName,
  typeSlugToName,
  type CourseCategory,
  type CourseType,
} from "@/shared/model";

export interface CategoryFilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface CourseFilterState {
  types: string[];
  majors: string[];
  categories: string[];
  search: string;
}

export const EMPTY_FILTERS: CourseFilterState = {
  types: [],
  majors: [],
  categories: [],
  search: "",
};

export const buildCategoryFilters = (): CategoryFilterOption[] =>
  (Object.keys(categorySlugToName) as CourseCategory[]).map((id) => ({
    id,
    label: categorySlugToName[id],
  }));

export const buildTypeFilters = (): CategoryFilterOption[] =>
  (Object.keys(typeSlugToName) as CourseType[]).map((id) => ({
    id,
    label: typeSlugToName[id],
  }));

export const MAJOR_OPTIONS = ["ИИ", "Разработка", "Бизнес"] as const;

// Major badge labels: maps the filter's RU major values to short display labels.
export const MAJOR_LABELS: Record<string, string> = {
  ИИ: "AI",
  Разработка: "SE",
  Бизнес: "Business",
};
