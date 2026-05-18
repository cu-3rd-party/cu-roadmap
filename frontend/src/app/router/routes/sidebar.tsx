import { lazy } from "react";

import WizardPage from "@/pages/wizard";

import { AppRoute } from "../types";

const LazyCalculatorPage = lazy(() => import("@/pages/calculator"));
const LazyCoursesPage = lazy(() => import("@/pages/courses"));
const LazyGoalPage = lazy(() => import("@/pages/goal"));
const LazyGraphPage = lazy(() => import("@/pages/graph"));
const LazyMajorsPage = lazy(() => import("@/pages/majors"));
const LazyManualPage = lazy(() => import("@/pages/manual"));
const LazyPlannerPage = lazy(() => import("@/pages/planner"));

export const sidebarRoutes: AppRoute[] = [
  { path: `wizard`, element: <WizardPage /> },
  { path: `courses`, element: <LazyCoursesPage /> },
  { path: `goal`, element: <LazyGoalPage /> },
  { path: `graph`, element: <LazyGraphPage /> },
  { path: `majors`, element: <LazyMajorsPage /> },
  { path: `planner`, element: <LazyPlannerPage /> },
  { path: `calculator`, element: <LazyCalculatorPage /> },
  { path: `manual`, element: <LazyManualPage /> },
];
