import { describe, expect, it } from "vitest";

import type { StructureSchoolDto } from "../../api/dto";
import { normalizeStructure } from "../normalizeStructure";

/* Years, majors and specializations are deliberately out of order and split
   across two schools — that is what the backend actually returns, since
   getStructure iterates nested Go maps without sorting. */
const SCHOOLS: StructureSchoolDto[] = [
  {
    school: "tech",
    cohort_years: [
      {
        year: 2026,
        majors: [
          {
            id: "m-ai-26",
            title: "Искусственный интеллект",
            internal_name: "ai",
            specializations: [],
          },
        ],
      },
      {
        year: 2025,
        majors: [
          {
            id: "m-swe-25",
            title: "Разработка",
            internal_name: "swe",
            specializations: [
              { id: "s-2", title: "Системная разработка" },
              { id: "s-1", title: "Инженерия данных" },
            ],
          },
        ],
      },
    ],
  },
  {
    school: "business",
    cohort_years: [
      {
        year: 2025,
        majors: [
          {
            id: "m-biz-25",
            title: "Бизнес и аналитика",
            internal_name: "business",
            specializations: [],
          },
        ],
      },
    ],
  },
];

describe("normalizeStructure", () => {
  it("sorts years ascending", () => {
    expect(normalizeStructure(SCHOOLS).map(({ year }) => year)).toEqual([
      2025, 2026,
    ]);
  });

  it("merges every school's majors into the same year bucket, title-sorted", () => {
    const [y2025] = normalizeStructure(SCHOOLS);

    expect(y2025.majors.map(({ title }) => title)).toEqual([
      "Бизнес и аналитика",
      "Разработка",
    ]);
  });

  it("maps internal_name to type and sorts specializations by title", () => {
    const swe = normalizeStructure(SCHOOLS)[0].majors.find(
      ({ id }) => id === "m-swe-25",
    );

    expect(swe?.type).toBe("swe");
    expect(swe?.specializations.map(({ title }) => title)).toEqual([
      "Инженерия данных",
      "Системная разработка",
    ]);
  });

  it("survives an empty tree", () => {
    expect(normalizeStructure([])).toEqual([]);
  });
});
