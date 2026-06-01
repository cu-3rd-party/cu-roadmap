import type { PlannedCourse } from "@/entities/roadmap";

export interface AvailableCourse extends PlannedCourse {
  category: string;
  description?: string;
}

const LONG = "Основы математического анализа и линейной алгебры 2";
const SHORT = "Математический анализ 2. Пилотный поток";
const LINEAR = "Линейная алгебра 2. Пилотный поток";

const DESC_MATH = "Пределы, производные, интегралы и приложения анализа.";
const DESC_LINEAR = "Матрицы, векторные пространства и линейные отображения.";

export const AVAILABLE_COURSES: AvailableCourse[] = [
  { id: "ac1", title: LONG, category: "fundamentals", description: DESC_MATH },
  { id: "ac2", title: SHORT, category: "fundamentals", description: DESC_MATH },
  {
    id: "ac3",
    title: LINEAR,
    category: "major-core",
    description: DESC_LINEAR,
  },
  { id: "ac4", title: LONG, category: "major-core", description: DESC_MATH },
  { id: "ac5", title: SHORT, category: "choice", description: DESC_MATH },
  { id: "ac6", title: LINEAR, category: "choice", description: DESC_LINEAR },
  { id: "ac7", title: LONG, category: "minor", description: DESC_MATH },
  { id: "ac8", title: LINEAR, category: "stem", description: DESC_LINEAR },
  { id: "ac9", title: LONG, category: "stem", description: DESC_MATH },
  { id: "ac10", title: SHORT, category: "soft", description: DESC_MATH },
    { id: "ac11", title: LONG, category: "fundamentals", description: DESC_MATH },
  { id: "ac12", title: SHORT, category: "fundamentals", description: DESC_MATH },
  {
    id: "ac13",
    title: LINEAR,
    category: "major-core",
    description: DESC_LINEAR,
  },
  { id: "ac14", title: LONG, category: "major-core", description: DESC_MATH },
  { id: "ac15", title: SHORT, category: "choice", description: DESC_MATH },
  { id: "ac16", title: LINEAR, category: "choice", description: DESC_LINEAR },
  { id: "ac17", title: LONG, category: "minor", description: DESC_MATH },
  { id: "ac18", title: LINEAR, category: "stem", description: DESC_LINEAR },
  { id: "ac19", title: LONG, category: "stem", description: DESC_MATH },
  { id: "ac20", title: SHORT, category: "soft", description: DESC_MATH },
    { id: "ac21", title: LONG, category: "fundamentals", description: DESC_MATH },
  { id: "ac22", title: SHORT, category: "fundamentals", description: DESC_MATH },
  {
    id: "ac23",
    title: LINEAR,
    category: "major-core",
    description: DESC_LINEAR,
  },
  { id: "ac24", title: LONG, category: "major-core", description: DESC_MATH },
  { id: "ac25", title: SHORT, category: "choice", description: DESC_MATH },
  { id: "ac26", title: LINEAR, category: "choice", description: DESC_LINEAR },
  { id: "ac27", title: LONG, category: "minor", description: DESC_MATH },
  { id: "ac28", title: LINEAR, category: "stem", description: DESC_LINEAR },
  { id: "ac29", title: LONG, category: "stem", description: DESC_MATH },
  { id: "ac30", title: SHORT, category: "soft", description: DESC_MATH },
    { id: "ac31", title: LONG, category: "fundamentals", description: DESC_MATH },
  { id: "ac32", title: SHORT, category: "fundamentals", description: DESC_MATH },
];
