export interface CategoryFilterOption {
  id: string;
  label: string;
  count: number;
}

export interface CourseFilterState {
  years: string[];
  majors: string[];
  categories: string[];
  search: string;
}

export const EMPTY_FILTERS: CourseFilterState = {
  years: [],
  majors: [],
  categories: [],
  search: "",
};

export const YEAR_OPTIONS = ["2023", "2024", "2025", "2026"] as const;

export const MAJOR_OPTIONS = ["ИИ", "Разработка", "Бизнес"] as const;

export const CATEGORY_FILTERS: CategoryFilterOption[] = [
  { id: "fundamentals", label: "Fundamentals", count: 10 },
  { id: "major-core", label: "Major Core", count: 6 },
  { id: "choice", label: "Choice", count: 5 },
  { id: "minor", label: "Minor", count: 3 },
  { id: "stem", label: "STEM", count: 4 },
  { id: "soft", label: "Soft", count: 3 },
];
