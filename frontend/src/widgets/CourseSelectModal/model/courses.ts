import type { PlannedCourse } from "@/shared/store";

const LONG = "Основы математического анализа и линейной алгебры 2";
const SHORT = "Математический анализ 2. Пилотный поток";
const LINEAR = "Линейная алгебра 2. Пилотный поток";

export const AVAILABLE_COURSES: PlannedCourse[] = [
  { id: "ac1", title: LONG },
  { id: "ac2", title: SHORT },
  { id: "ac3", title: LINEAR },
  { id: "ac4", title: LONG },
  { id: "ac5", title: SHORT },
  { id: "ac6", title: LINEAR },
  { id: "ac7", title: LONG },
  { id: "ac8", title: LINEAR },
  { id: "ac9", title: LONG },
  { id: "ac10", title: SHORT },
];
