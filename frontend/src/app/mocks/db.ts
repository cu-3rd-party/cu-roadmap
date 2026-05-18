import type { Course, GraphData, Major } from "@/shared/config";

import { MOCK_COURSES, MOCK_GRAPH, MOCK_MAJORS } from "./data";

const coursesDb: Course[] = MOCK_COURSES.map((course) => ({ ...course }));
const majorsDb: Major[] = MOCK_MAJORS.map((major) => ({ ...major }));
const graphDb: GraphData = {
  nodes: MOCK_GRAPH.nodes.map((node) => ({ ...node })),
  edges: MOCK_GRAPH.edges.map((edge) => ({ ...edge })),
};

export const getCoursesDb = (): Course[] =>
  coursesDb.map((course) => ({ ...course }));

export const getMajorsDb = (): Major[] =>
  majorsDb.map((major) => ({ ...major }));

export const getGraphDb = (): GraphData => ({
  nodes: graphDb.nodes.map((node) => ({ ...node })),
  edges: graphDb.edges.map((edge) => ({ ...edge })),
});
