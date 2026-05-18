import { http, HttpResponse } from "msw";

import { getCoursesDb } from "../db";

export const coursesHandlers = [
  http.get("/api/v1/courses/", () => HttpResponse.json(getCoursesDb())),
];
