import type { CategoryCourse } from "@/widgets/CoursesSection";

export interface CatalogCourse extends CategoryCourse {
  year: string;
  major: string;
  description?: string;
}

export interface CatalogCategory {
  id: string;
  title: string;
  selected: number;
  total: number;
  courses: CatalogCourse[];
}

const LONG = "Основы математического анализа и линейной алгебры 2";
const SHORT = "Математический анализ 2. Пилотный поток";
const LINEAR = "Линейная алгебра 2. Пилотный поток";

const DESC_MATH = "Пределы, производные, интегралы и приложения анализа.";
const DESC_LINEAR = "Матрицы, векторные пространства и линейные отображения.";

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: "fundamentals",
    title: "Fundamentals",
    selected: 0,
    total: 5,
    courses: [
      {
        id: "f1",
        title: LONG,
        year: "2023",
        major: "ИИ",
        description: DESC_MATH,
      },
      {
        id: "f2",
        title: SHORT,
        year: "2024",
        major: "Разработка",
        description: DESC_MATH,
      },
      {
        id: "f3",
        title: LINEAR,
        year: "2025",
        major: "Бизнес",
        description: DESC_LINEAR,
      },
      {
        id: "f4",
        title: LONG,
        year: "2026",
        major: "ИИ",
        description: DESC_MATH,
      },
      {
        id: "f5",
        title: SHORT,
        year: "2023",
        major: "Разработка",
        description: DESC_MATH,
      },
      {
        id: "f6",
        title: LINEAR,
        year: "2024",
        major: "Бизнес",
        description: DESC_LINEAR,
      },
      {
        id: "f7",
        title: LONG,
        year: "2025",
        major: "ИИ",
        description: DESC_MATH,
      },
      {
        id: "f8",
        title: SHORT,
        year: "2026",
        major: "Разработка",
        description: DESC_MATH,
      },
      {
        id: "f9",
        title: LONG,
        year: "2023",
        major: "Бизнес",
        description: DESC_MATH,
      },
      {
        id: "f10",
        title: SHORT,
        year: "2024",
        major: "ИИ",
        description: DESC_MATH,
      },
    ],
  },
  {
    id: "major-core",
    title: "Major Core",
    selected: 0,
    total: 5,
    courses: [
      {
        id: "m1",
        title: LONG,
        year: "2024",
        major: "Разработка",
        description: DESC_MATH,
      },
      {
        id: "m2",
        title: SHORT,
        year: "2025",
        major: "Разработка",
        description: DESC_MATH,
      },
      {
        id: "m3",
        title: LINEAR,
        year: "2026",
        major: "ИИ",
        description: DESC_LINEAR,
      },
      {
        id: "m4",
        title: LONG,
        year: "2023",
        major: "Бизнес",
        description: DESC_MATH,
      },
      {
        id: "m5",
        title: SHORT,
        year: "2024",
        major: "ИИ",
        description: DESC_MATH,
      },
      {
        id: "m6",
        title: LINEAR,
        year: "2025",
        major: "Разработка",
        description: DESC_LINEAR,
      },
    ],
  },
  {
    id: "choice",
    title: "Choice",
    selected: 0,
    total: 5,
    courses: [
      {
        id: "c1",
        title: LONG,
        year: "2025",
        major: "ИИ",
        description: DESC_MATH,
      },
      {
        id: "c2",
        title: SHORT,
        year: "2026",
        major: "Бизнес",
        description: DESC_MATH,
      },
      {
        id: "c3",
        title: LINEAR,
        year: "2023",
        major: "Разработка",
        description: DESC_LINEAR,
      },
      {
        id: "c4",
        title: LONG,
        year: "2024",
        major: "ИИ",
        description: DESC_MATH,
      },
      {
        id: "c5",
        title: SHORT,
        year: "2025",
        major: "Бизнес",
        description: DESC_MATH,
      },
      {
        id: "c6",
        title: LINEAR,
        year: "2026",
        major: "Разработка",
        description: DESC_LINEAR,
      },
    ],
  },
  {
    id: "minor",
    title: "Minor",
    selected: 0,
    total: 5,
    courses: [
      {
        id: "mn1",
        title: LONG,
        year: "2023",
        major: "Бизнес",
        description: DESC_MATH,
      },
      {
        id: "mn2",
        title: SHORT,
        year: "2024",
        major: "ИИ",
        description: DESC_MATH,
      },
      {
        id: "mn3",
        title: LONG,
        year: "2025",
        major: "Разработка",
        description: DESC_MATH,
      },
    ],
  },
  {
    id: "stem",
    title: "STEM",
    selected: 0,
    total: 5,
    courses: [
      {
        id: "s1",
        title: LONG,
        year: "2024",
        major: "ИИ",
        description: DESC_MATH,
      },
      {
        id: "s2",
        title: SHORT,
        year: "2025",
        major: "Разработка",
        description: DESC_MATH,
      },
      {
        id: "s3",
        title: LINEAR,
        year: "2026",
        major: "Бизнес",
        description: DESC_LINEAR,
      },
      {
        id: "s4",
        title: LONG,
        year: "2023",
        major: "ИИ",
        description: DESC_MATH,
      },
    ],
  },
  {
    id: "soft",
    title: "Soft",
    selected: 0,
    total: 5,
    courses: [
      {
        id: "so1",
        title: LONG,
        year: "2025",
        major: "Бизнес",
        description: DESC_MATH,
      },
      {
        id: "so2",
        title: SHORT,
        year: "2026",
        major: "ИИ",
        description: DESC_MATH,
      },
      {
        id: "so3",
        title: LINEAR,
        year: "2023",
        major: "Разработка",
        description: DESC_LINEAR,
      },
    ],
  },
];
