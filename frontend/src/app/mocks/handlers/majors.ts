import { http, HttpResponse } from "msw";

import { MOCK_MAJOR_RESULTS } from "../data";
import { getMajorsDb } from "../db";

export const majorsHandlers = [
  http.get("/api/v1/majors/", () => HttpResponse.json(getMajorsDb())),
  http.post("/api/v1/majors/identify/", () =>
    HttpResponse.json(MOCK_MAJOR_RESULTS),
  ),
];
