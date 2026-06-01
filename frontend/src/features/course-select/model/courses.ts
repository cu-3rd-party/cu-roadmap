import type { PlannedCourse } from "@/shared/store";

export interface AvailableCourse extends PlannedCourse {
  /** Matches a CATEGORY_FILTERS id from @/features/course-filters. */
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
];
