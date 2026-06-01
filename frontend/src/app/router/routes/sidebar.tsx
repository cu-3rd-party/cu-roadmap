import { lazy } from "react";

import PlannerPage from "@/pages/planner";

import { AppRoute } from "../types";

const LazyCatalogPage = lazy(() => import("@/pages/catalog"));

export const sidebarRoutes: AppRoute[] = [
  { path: `planner`, element: <PlannerPage /> },
  { path: `catalog`, element: <LazyCatalogPage /> },
];
