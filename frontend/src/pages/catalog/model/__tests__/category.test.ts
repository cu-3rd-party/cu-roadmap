import { describe, expect, it } from "vitest";

import type { CategoryFilterOption } from "@/features/course-filters";

import { categoryToDescription, optionDescription } from "../category";

const option = (over: Partial<CategoryFilterOption>): CategoryFilterOption => ({
  id: "id",
  label: "Label",
  type: "other",
  ...over,
});

describe("optionDescription", () => {
  it("uses the fixed core description", () => {
    expect(optionDescription(option({ type: "core" }))).toBe(
      "Обязательные курсы мейджора",
    );
  });

  it("uses the fixed choice description", () => {
    expect(optionDescription(option({ type: "choice" }))).toBe(
      "Курсы выбранной специализации",
    );
  });

  it("core/choice take precedence over category", () => {
    expect(optionDescription(option({ type: "core", category: "ai" }))).toBe(
      "Обязательные курсы мейджора",
    );
  });

  it("falls back to the category description", () => {
    expect(optionDescription(option({ type: "other", category: "ai" }))).toBe(
      categoryToDescription.ai,
    );
  });

  it("returns undefined when neither type nor category matches", () => {
    expect(optionDescription(option({ type: "elective" }))).toBeUndefined();
  });
});
