import type { ComparisonOperator, SpecializationTab } from "./types";

export interface RuleCategoryOption {
  id: string;
  label: string;
}

/* ATTENTION PLACEHOLDER categories — the real list comes from the boxes/categories
   endpoint. Only the shape matters until then. */
export const RULE_CATEGORY_OPTIONS: RuleCategoryOption[] = [
  { id: "major-core", label: "Major Core" },
  { id: "minor", label: "Minor" },
  { id: "business", label: "Business" },
];

export const COMPARISON_OPTIONS: {
  value: ComparisonOperator;
  label: string;
}[] = [
  { value: "eq", label: "=" },
  { value: "lt", label: "<" },
  { value: "gt", label: ">" },
];

export const SPECIALIZATION_TAB_LABELS: Record<SpecializationTab, string> = {
  courses: "Курсы",
  restrictions: "Ограничения",
};
