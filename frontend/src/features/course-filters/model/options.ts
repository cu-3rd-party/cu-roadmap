import type { Course } from "@/entities/course";
import type { Specialization } from "@/entities/specialization";
import {
  categorySlugToName,
  MAJOR_TYPES,
  OTHER_CATEGORIES,
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

// Build the combined type + category chips. Each chip carries a course type and,
// optionally, a category or specialization used to match courses against it.
export const buildCategoryFilters = (
  majorType: MajorType | null,
  specializations: Specialization[],
): CategoryFilterOption[] => {
  const otherMajorCategories = MAJOR_TYPES.filter((type) => type !== majorType);

  const options: CategoryFilterOption[] = [
    // Major Core — no category
    { id: "core", type: "core", label: typeSlugToName.core },
    // Major Choice — one chip per specialization
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

  // Elective for the selected major type (first elective chip)
  if (majorType) {
    options.push({
      id: `elective:${majorType}`,
      type: "elective",
      label: typeSlugToName.elective,
      category: majorType,
    });
  }

  // Other — fundamentals / stem / soft
  options.push(
    ...OTHER_CATEGORIES.map(
      (category): CategoryFilterOption => ({
        id: `other:${category}`,
        type: "other",
        label: categorySlugToName[category],
        category,
      }),
    ),
  );

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

  return options;
};

export const buildTypeFilters = (): CategoryFilterOption[] =>
  (Object.keys(typeSlugToName) as CourseType[]).map((id) => ({
    id,
    label: typeSlugToName[id],
    type: id,
  }));

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
