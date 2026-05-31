export interface CategoryFilterOption {
  label: string;
  count: number;
}

export const YEAR_OPTIONS = ["2023", "2024", "2025", "2026"] as const;

export const MAJOR_OPTIONS = ["ИИ", "Разработка", "Бизнес"] as const;

export const ACTIVE_MAJOR = "Разработка";

export const CATEGORY_FILTERS: CategoryFilterOption[] = [
  { label: "Fundamentals", count: 10 },
  { label: "Major Core", count: 6 },
  { label: "Choice", count: 5 },
  { label: "Minor", count: 3 },
  { label: "STEM", count: 4 },
  { label: "Soft", count: 3 },
];
