import { http, HttpResponse } from "msw";

import { getGraphDb } from "../db";

export const graphHandlers = [
  http.get("/api/v1/graph/data/", () => HttpResponse.json(getGraphDb())),
];
