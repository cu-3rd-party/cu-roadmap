import type { PlannedCourse } from "@/entities/roadmap";

export interface AvailableCourse extends PlannedCourse {
  category: string;
  major: string;
  description?: string;
}

const LONG = "Основы математического анализа и линейной алгебры 2";
const SHORT = "Математический анализ 2. Пилотный поток";
const LINEAR = "Линейная алгебра 2. Пилотный поток";

const DESC_MATH = "Пределы, производные, интегралы и приложения анализа.";
const DESC_LINEAR = "Матрицы, векторные пространства и линейные отображения.";

export const AVAILABLE_COURSES: AvailableCourse[] = [
  { id: "ac1", title: LONG, category: "fundamentals", major: "SE", description: DESC_MATH },
  { id: "ac2", title: SHORT, category: "fundamentals", major: "AI", description: DESC_MATH },
  { id: "ac3", title: LINEAR, category: "major-core", major: "Business", description: DESC_LINEAR },
  { id: "ac4", title: LONG, category: "major-core", major: "SE", description: DESC_MATH },
  { id: "ac5", title: SHORT, category: "choice", major: "AI", description: DESC_MATH },
  { id: "ac6", title: LINEAR, category: "choice", major: "Business", description: DESC_LINEAR },
  { id: "ac7", title: LONG, category: "minor", major: "SE", description: DESC_MATH },
  { id: "ac8", title: LINEAR, category: "stem", major: "AI", description: DESC_LINEAR },
  { id: "ac9", title: LONG, category: "stem", major: "Business", description: DESC_MATH },
  { id: "ac10", title: SHORT, category: "soft", major: "SE", description: DESC_MATH },
  { id: "ac11", title: LONG, category: "fundamentals", major: "AI", description: DESC_MATH },
  { id: "ac12", title: SHORT, category: "fundamentals", major: "Business", description: DESC_MATH },
  { id: "ac13", title: LINEAR, category: "major-core", major: "SE", description: DESC_LINEAR },
  { id: "ac14", title: LONG, category: "major-core", major: "AI", description: DESC_MATH },
  { id: "ac15", title: SHORT, category: "choice", major: "Business", description: DESC_MATH },
  { id: "ac16", title: LINEAR, category: "choice", major: "SE", description: DESC_LINEAR },
  { id: "ac17", title: LONG, category: "minor", major: "AI", description: DESC_MATH },
  { id: "ac18", title: LINEAR, category: "stem", major: "Business", description: DESC_LINEAR },
  { id: "ac19", title: LONG, category: "stem", major: "SE", description: DESC_MATH },
  { id: "ac20", title: SHORT, category: "soft", major: "AI", description: DESC_MATH },
  { id: "ac21", title: LONG, category: "fundamentals", major: "Business", description: DESC_MATH },
  { id: "ac22", title: SHORT, category: "fundamentals", major: "SE", description: DESC_MATH },
  { id: "ac23", title: LINEAR, category: "major-core", major: "AI", description: DESC_LINEAR },
  { id: "ac24", title: LONG, category: "major-core", major: "Business", description: DESC_MATH },
  { id: "ac25", title: SHORT, category: "choice", major: "SE", description: DESC_MATH },
  { id: "ac26", title: LINEAR, category: "choice", major: "AI", description: DESC_LINEAR },
  { id: "ac27", title: LONG, category: "minor", major: "Business", description: DESC_MATH },
  { id: "ac28", title: LINEAR, category: "stem", major: "SE", description: DESC_LINEAR },
  { id: "ac29", title: LONG, category: "stem", major: "AI", description: DESC_MATH },
  { id: "ac30", title: SHORT, category: "soft", major: "Business", description: DESC_MATH },
  { id: "ac31", title: LONG, category: "fundamentals", major: "SE", description: DESC_MATH },
  { id: "ac32", title: SHORT, category: "fundamentals", major: "AI", description: DESC_MATH },
];
