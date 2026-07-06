import type { Course } from "@/entities/course";
import type { Specialization } from "@/entities/specialization";
import {
  categorySlugToName,
  MAJOR_TYPES,
  typeSlugToName,
  type CourseCategory,
  type CourseType,
  type MajorType,
  type UUID,
} from "@/shared/model";

export interface CategoryFilterOption {
  id: string;
  label: string;
  type: CourseType;
  category?: CourseCategory;
  // Only set for "choice" chips; used to match courses by specialization.
  specializationId?: UUID;
  count?: number;
}

export type FilterGroup =
  | "all"
  | "core"
  | "choice"
  | "elective"
  | "fundamentals"
  | "other";

// Top-level (row 1) chips, single-select, in display order.
export const FILTER_GROUPS: { id: FilterGroup; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "core", label: typeSlugToName.core },
  { id: "choice", label: typeSlugToName.choice },
  { id: "elective", label: typeSlugToName.elective },
  { id: "fundamentals", label: "Fundamentals" },
  { id: "other", label: typeSlugToName.other },
];

export interface CourseFilterState {
  availableSemesters: string[];
  semesters: string[];
  workload: string[];
  group: FilterGroup;
  sub: string;
  search: string;
}

export const EMPTY_FILTERS: CourseFilterState = {
  availableSemesters: [],
  semesters: [],
  workload: [],
  group: "all",
  sub: "all",
  search: "",
};

// Build the catalog cards / filter options. Each option carries a course type
// and, optionally, a category or specialization used to match courses against it.
export const buildCategoryFilters = (
  majorType: MajorType | null,
  specializations: Specialization[],
): CategoryFilterOption[] => {
  const otherMajorCategories = MAJOR_TYPES.filter((type) => type !== majorType);

  const options: CategoryFilterOption[] = [
    // Core
    { id: "core", type: "core", label: typeSlugToName.core },
    ...specializations.map(
      (spec): CategoryFilterOption => ({
        id: `choice:${spec.id}`,
        type: "choice",
        label: spec.title,
        category: majorType ?? undefined,
        specializationId: spec.id,
      }),
    ),
  ];

  // Elective for the selected major type (first elective card)
  if (majorType) {
    options.push({
      id: `elective:${majorType}`,
      type: "elective",
      label: typeSlugToName.elective,
      category: majorType,
    });
  }

  // Elective for the remaining major types — labeled with the major-type name
  options.push(
    ...otherMajorCategories.map(
      (category): CategoryFilterOption => ({
        id: `elective:${category}`,
        type: "elective",
        label: categorySlugToName[category],
        category,
      }),
    ),
  );

  // Fundamentals split into mandatory (type other) and elective (type elective)
  options.push(
    {
      id: "fundamentals:mandatory",
      type: "other",
      label: categorySlugToName.fundamentals,
      category: "fundamentals",
    },
    {
      id: "fundamentals:elective",
      type: "elective",
      label: `${categorySlugToName.fundamentals} (${typeSlugToName.elective})`,
      category: "fundamentals",
    },
  );

  // Other — stem / soft
  options.push(
    ...(["stem", "soft"] as CourseCategory[]).map(
      (category): CategoryFilterOption => ({
        id: `flex:${category}`,
        type: "flex",
        label: categorySlugToName[category],
        category,
      }),
    ),
  );

  return options;
};

export const buildSubOptions = (
  group: FilterGroup,
  majorType: MajorType | null,
  specializations: Specialization[],
): { id: string; label: string }[] => {
  const all = { id: "all", label: "Все" };

  switch (group) {
    case "choice":
      return [
        all,
        ...specializations.map((spec) => ({ id: spec.id, label: spec.title })),
      ];
    case "elective": {
      const ordered = majorType
        ? [majorType, ...MAJOR_TYPES.filter((type) => type !== majorType)]
        : [...MAJOR_TYPES];
      return [
        all,
        ...ordered.map((category) => ({
          id: category,
          label: categorySlugToName[category],
        })),
      ];
    }
    case "fundamentals":
      return [
        all,
        { id: "mandatory", label: "Обязательные" },
        { id: "elective", label: typeSlugToName.elective },
      ];
    case "other":
      return [
        all,
        { id: "stem", label: categorySlugToName.stem },
        { id: "soft", label: categorySlugToName.soft },
      ];
    default:
      return [];
  }
};

// Whether a catalog card / option survives the current (group, sub) selection.
export const optionMatchesFilter = (
  option: CategoryFilterOption,
  group: FilterGroup,
  sub: string,
): boolean => {
  switch (group) {
    case "all":
      return true;
    case "core":
      return option.type === "core";
    case "choice":
      return (
        option.type === "choice" &&
        (sub === "all" || option.specializationId === sub)
      );
    case "elective":
      return (
        option.type === "elective" &&
        option.category != null &&
        (MAJOR_TYPES as readonly string[]).includes(option.category) &&
        (sub === "all" || option.category === sub)
      );
    case "fundamentals":
      if (option.category !== "fundamentals") return false;
      if (sub === "all") return true;
      return sub === "mandatory"
        ? option.type === "other"
        : option.type === "elective";
    case "other":
      return (
        (option.category === "stem" || option.category === "soft") &&
        (sub === "all" || option.category === sub)
      );
  }
};

// Match a single course against a combined type/category chip.
export const courseMatchesOption = (
  course: Course,
  option: CategoryFilterOption,
): boolean => {
  if (course.type !== option.type) return false;
  if (option.specializationId) {
    return course.specializations?.includes(option.specializationId) ?? false;
  }
  if (option.category) {
    return course.category === option.category;
  }
  return true;
};

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

// Workload chips (pairs/week). The last option ("4") renders as "4+" and
// matches any course with workload >= 4; the rest match the exact number.
export const WORKLOAD_OPTIONS = ["1", "2", "3", "4"] as const;
