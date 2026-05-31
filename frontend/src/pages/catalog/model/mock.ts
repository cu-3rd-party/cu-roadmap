import type { CategoryCourse } from "@/widgets/CoursesSection";

export interface CatalogCategory {
  id: string;
  title: string;
  selected: number;
  total: number;
  courses: CategoryCourse[];
}

const LONG = "Основы математического анализа и линейной алгебры 2";
const SHORT = "Математический анализ 2. Пилотный поток";
const LINEAR = "Линейная алгебра 2. Пилотный поток";

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: "fundamentals",
    title: "Fundamentals",
    selected: 0,
    total: 5,
    courses: [
      { id: "f1", title: LONG },
      { id: "f2", title: SHORT },
      { id: "f3", title: LINEAR },
      { id: "f4", title: LONG },
      { id: "f5", title: SHORT },
      { id: "f6", title: LINEAR },
      { id: "f7", title: LONG },
      { id: "f8", title: SHORT },
      { id: "f9", title: LONG },
      { id: "f10", title: SHORT },
    ],
  },
  {
    id: "major-core",
    title: "Major Core",
    selected: 0,
    total: 5,
    courses: [
      { id: "m1", title: LONG },
      { id: "m2", title: SHORT },
      { id: "m3", title: LINEAR },
      { id: "m4", title: LONG },
      { id: "m5", title: SHORT },
      { id: "m6", title: LINEAR },
    ],
  },
  {
    id: "choice",
    title: "Choice",
    selected: 0,
    total: 5,
    courses: [
      { id: "c1", title: LONG },
      { id: "c2", title: SHORT },
      { id: "c3", title: LINEAR },
      { id: "c4", title: LONG },
      { id: "c5", title: SHORT },
      { id: "c6", title: LINEAR },
    ],
  },
  {
    id: "minor",
    title: "Minor",
    selected: 0,
    total: 5,
    courses: [
      { id: "mn1", title: LONG },
      { id: "mn2", title: SHORT },
      { id: "mn3", title: LONG },
    ],
  },
  {
    id: "stem",
    title: "STEM",
    selected: 0,
    total: 5,
    courses: [
      { id: "s1", title: LONG },
      { id: "s2", title: SHORT },
      { id: "s3", title: LINEAR },
      { id: "s4", title: LONG },
    ],
  },
  {
    id: "soft",
    title: "& Soft",
    selected: 0,
    total: 5,
    courses: [
      { id: "so1", title: LONG },
      { id: "so2", title: SHORT },
      { id: "so3", title: LINEAR },
    ],
  },
];
