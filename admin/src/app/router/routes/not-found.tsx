import { lazy } from "react";

import type { AppRoute } from "../types";

const LazyNotFoundPage = lazy(() => import("@/pages/not-found"));

export const fallbackRoutes: AppRoute[] = [
  { path: `*`, element: <LazyNotFoundPage /> },
];
