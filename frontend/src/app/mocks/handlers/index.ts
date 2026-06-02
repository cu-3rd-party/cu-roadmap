import { coursesHandlers } from "./courses";
import { majorsHandlers } from "./majors";
import { plannerHandlers } from "./planner";

export const handlers = [
  ...coursesHandlers,
  ...majorsHandlers,
  ...plannerHandlers,
];
