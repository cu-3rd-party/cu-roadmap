import { Course } from "@/entities/course";
import {
  courseMatchesOption,
  type CategoryFilterOption,
} from "@/features/course-filters";
import { sortKey } from "@/shared/lib";

import { CatalogCategory } from "../model";

// Build one catalog section per filter chip, grouping courses with the same
// matcher the chips use. Section order mirrors the chip order.
export const buildCatalogCategories = (
  courses: Course[],
  options: CategoryFilterOption[],
): CatalogCategory[] =>
  options.map((option) => ({
    option,
    courses: courses
      .filter((course) => courseMatchesOption(course, option))
      .sort((a, b) => sortKey(a.title).localeCompare(sortKey(b.title), "ru")),
  }));
