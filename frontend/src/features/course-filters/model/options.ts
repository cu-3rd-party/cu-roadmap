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
  semesters: string[];
  categories: string[];
  search: string;
}

export const EMPTY_FILTERS: CourseFilterState = {
  types: [],
  semesters: [],
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

export const SEMESTER_OPTIONS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
] as const;
