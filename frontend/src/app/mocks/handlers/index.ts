import { coursesHandlers } from "./courses";
import { graphHandlers } from "./graph";
import { majorsHandlers } from "./majors";
import { plannerHandlers } from "./planner";

export const handlers = [
  ...coursesHandlers,
  ...majorsHandlers,
  ...plannerHandlers,
  ...graphHandlers,
];
