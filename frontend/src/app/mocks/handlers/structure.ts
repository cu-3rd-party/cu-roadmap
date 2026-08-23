import { http, HttpResponse } from "msw";

import type {
  StructureMajorDto,
  StructureSchoolDto,
  StructureSpecializationDto,
} from "@/entities/major";

/*
Fixture for the admin specializations screen, so `pnpm dev:mock` has a year ->
major -> specialization tree to render with no backend running.

Titles are the exact strings getMajors/getStructure switch on to derive
`internal_name` (backend/api/majors.go) — rename one here and its slug comes
back as "" instead of swe/ai/business.
*/

interface MajorSeed {
  // Two hex digits, used to build stable ids. Unique across schools.
  code: string;
  title: string;
  internalName: string;
  // 1-2 per year, deliberately different between years so switching the year
  // tab visibly changes the list.
  specializationsByYear: Record<number, string[]>;
}

interface SchoolSeed {
  school: string;
  majors: MajorSeed[];
}

const YEARS = [2024, 2025, 2026];

/* Two schools on purpose: the tree nests school -> year, and the admin screen
   merges every school into a single year bucket. One school would never
   exercise that path. */
const SCHOOLS: SchoolSeed[] = [
  {
    school: "tech",
    majors: [
      {
        code: "01",
        title: "Разработка",
        internalName: "swe",
        specializationsByYear: {
          2024: ["Системная разработка"],
          2025: ["Системная разработка", "Инженерия данных"],
          2026: ["Инженерия данных", "Мобильная разработка"],
        },
      },
      {
        code: "02",
        title: "Искусственный интеллект",
        internalName: "ai",
        specializationsByYear: {
          2024: ["Компьютерное зрение"],
          2025: ["Компьютерное зрение", "Обработка языка"],
          2026: ["Обработка языка", "Рекомендательные системы"],
        },
      },
    ],
  },
  {
    school: "business",
    majors: [
      {
        code: "03",
        title: "Бизнес и аналитика",
        internalName: "business",
        specializationsByYear: {
          2024: ["Продуктовая аналитика"],
          2025: ["Продуктовая аналитика", "Финтех"],
          2026: ["Финтех"],
        },
      },
    ],
  },
];

/* Ids are derived, not random, so a specialization's restrictions URL still
   resolves after a page reload. */
const majorId = (code: string, year: number) =>
  `000000${code}-0000-4000-8000-${String(year).padStart(12, "0")}`;

const specializationId = (code: string, year: number, index: number) =>
  `0000${code}${String(index).padStart(2, "0")}-0001-4000-8000-${String(year).padStart(12, "0")}`;

const buildTree = (): StructureSchoolDto[] =>
  SCHOOLS.map(({ school, majors }) => ({
    school,
    cohort_years: YEARS.map((year) => ({
      year,
      majors: majors.map(
        ({
          code,
          title,
          internalName,
          specializationsByYear,
        }): StructureMajorDto => ({
          id: majorId(code, year),
          title,
          internal_name: internalName,
          specializations: (specializationsByYear[year] ?? []).map(
            (specTitle, index): StructureSpecializationDto => ({
              id: specializationId(code, year, index),
              title: specTitle,
            }),
          ),
        }),
      ),
    })),
  }));

/* Mutable so POST can append to what GET serves — that is what makes
   "add -> navigate -> back" show the new row. Resets on page reload, which is
   the right lifetime for a mock. */
let tree: StructureSchoolDto[] = buildTree();

let createdCount = 0;

const findMajor = (id: string): StructureMajorDto | undefined =>
  tree
    .flatMap(({ cohort_years }) => cohort_years)
    .flatMap(({ majors }) => majors)
    .find((major) => major.id === id);

// Exported for tests and for a REPL poke; not used by the handlers themselves.
export const resetStructureMock = () => {
  tree = buildTree();
  createdCount = 0;
};

export const structureHandlers = [
  /* The leading "*" keeps the match working when VITE_API_URL points the axios
     client at another origin; without it only same-origin calls would match. */
  http.get("*/api/v1/majors/structure", () => HttpResponse.json(tree)),

  http.post("*/api/v1/majors/specializations", async ({ request }) => {
    const { major_id: majorIdValue, title } = (await request.json()) as {
      major_id: string;
      title: string;
    };

    const major = findMajor(majorIdValue);
    if (!major) {
      // Same shape the real handler returns for an unparseable/unknown major.
      return HttpResponse.json({ error: "invalid major id" }, { status: 400 });
    }

    const created: StructureSpecializationDto = {
      id: `0000ffff-0002-4000-8000-${String(++createdCount).padStart(12, "0")}`,
      title,
    };
    major.specializations.push(created);

    /* 201 with the whole object, not { id } — that is what the Go handler does,
       and createSpecialization reads .data.id off it. */
    return HttpResponse.json(
      { id: created.id, major_id: majorIdValue, title },
      { status: 201 },
    );
  }),
];
