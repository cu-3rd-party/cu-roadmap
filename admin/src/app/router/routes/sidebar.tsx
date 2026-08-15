import { BookOpen, LayoutDashboard, SlidersHorizontal } from "lucide-react";
import { lazy } from "react";

import type { AppRoute } from "../types";

const LazyDashboardPage = lazy(() => import("@/pages/dashboard"));
const LazyCoursesPage = lazy(() => import("@/pages/courses"));
const LazyRestrictionsPage = lazy(() => import("@/pages/restrictions"));

// Single source of truth for both the router and the sidebar nav — add a route
// here and it appears in the shell automatically.
export interface SidebarRoute extends AppRoute {
  label: string;
  icon: typeof LayoutDashboard;
}

export const sidebarRoutes: SidebarRoute[] = [
  {
    path: "dashboard",
    label: "Обзор",
    icon: LayoutDashboard,
    element: <LazyDashboardPage />,
  },
  {
    path: "courses",
    label: "Дисциплины",
    icon: BookOpen,
    element: <LazyCoursesPage />,
  },
  {
    path: "restrictions",
    label: "Ограничения",
    icon: SlidersHorizontal,
    element: <LazyRestrictionsPage />,
  },
];
