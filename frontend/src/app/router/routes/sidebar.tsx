import { lazy } from "react";

import PlannerPage from "@/pages/planner";

import { AppRoute } from "../types";

const LazyCatalogPage = lazy(() => import("@/pages/catalog"));
const LazyGlossaryPage = lazy(() => import("@/pages/glossary"));

export const sidebarRoutes: AppRoute[] = [
  { path: `glossary`, element: <LazyGlossaryPage /> },
  { path: `planner`, element: <PlannerPage /> },
  { path: `catalog`, element: <LazyCatalogPage /> },
];
