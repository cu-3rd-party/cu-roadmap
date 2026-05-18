import { http, HttpResponse } from "msw";

import { MOCK_ROADMAP, MOCK_VALIDATION } from "../data";

export const plannerHandlers = [
  http.post("/api/v1/planner/generate/", () => HttpResponse.json(MOCK_ROADMAP)),
  http.post("/api/v1/planner/goal-path/", () =>
    HttpResponse.json({ roadmap: MOCK_ROADMAP.roadmap }),
  ),
  http.post("/api/v1/planner/validate-roadmap/", () =>
    HttpResponse.json({ validation_results: MOCK_VALIDATION }),
  ),
];
