import { BookOpen, Package, Route as RouteIcon } from "lucide-react";
import { lazy, type ReactNode } from "react";

import type { AppRoute } from "../types";

const LazyTrajectoriesPage = lazy(() => import("@/pages/admin/trajectories"));
const LazyBoxesPage = lazy(() => import("@/pages/admin/groups"));
const LazyCoursesPage = lazy(() => import("@/pages/admin/courses"));
const LazyRestrictionsPage = lazy(() => import("@/pages/admin/restrictions"));
const LazyCourseEditPage = lazy(() => import("@/pages/admin/course"));
const LazyGroupEditPage = lazy(() => import("@/pages/admin/group"));

// Single source of truth for both the router and the admin navbar — add a route
// here and it appears in the admin shell automatically. `protected` is what puts
// it behind the login gate; AppRouter groups on that flag.
export interface AdminRoute extends AppRoute {
  label: string;
  icon: ReactNode;
}

export const adminRoutes: AdminRoute[] = [
  {
    path: "admin/specializations",
    label: "Специализации",
    icon: <RouteIcon />,
    element: <LazyTrajectoriesPage />,
    protected: true,
  },
  {
    path: "admin/boxes",
    label: "Коробки",
    icon: <Package />,
    element: <LazyBoxesPage />,
    protected: true,
  },
  {
    path: "admin/courses",
    label: "Курсы",
    icon: <BookOpen />,
    element: <LazyCoursesPage />,
    protected: true,
  },
];

/* Router-only: reachable by navigating from a course card, and deliberately
   absent from `adminRoutes` — that array is what AdminNavbar maps over, so a
   `:param` path listed there would render a broken nav item. */
export const adminDetailRoutes: AppRoute[] = [
  {
    path: "admin/courses/:courseId",
    element: <LazyCourseEditPage />,
    protected: true,
  },
  {
    path: "admin/boxes/:groupId",
    element: <LazyGroupEditPage />,
    protected: true,
  },
  {
    path: "admin/specializations/:specializationId/restrictions",
    element: <LazyRestrictionsPage />,
    protected: true,
  },
];
