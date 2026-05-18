import { lazy } from "react";

import { AppRoute } from "../types";

const LazyNotFoundPage = lazy(() => import("@/pages/not-found"));

export const fallbackRoutes: AppRoute[] = [
  { path: `*`, element: <LazyNotFoundPage /> },
];
