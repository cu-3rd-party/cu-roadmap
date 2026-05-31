import { lazy } from "react";

import { AppRoute } from "../types";

const LazyButtonDemoPage = lazy(() => import("@/pages/button-demo"));
const LazyCatalogPage = lazy(() => import("@/pages/catalog"));
const LazyPlannerPage = lazy(() => import("@/pages/planner"));

export const sidebarRoutes: AppRoute[] = [
  { path: `catalog`, element: <LazyCatalogPage /> },
  { path: `planner`, element: <LazyPlannerPage /> },
  { path: `button-demo`, element: <LazyButtonDemoPage /> },
];
