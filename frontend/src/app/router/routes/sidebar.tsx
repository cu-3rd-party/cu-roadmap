import { lazy } from "react";

import PlannerPage from "@/pages/planner";

import { AppRoute } from "../types";

const LazyCatalogPage = lazy(() => import("@/pages/catalog"));
const LazyAdminPage = lazy(() => import("@/pages/admin"));

export const sidebarRoutes: AppRoute[] = [
  { path: `planner`, element: <PlannerPage /> },
  { path: `catalog`, element: <LazyCatalogPage /> },
  { path: `admin`, element: <LazyAdminPage /> },
];
