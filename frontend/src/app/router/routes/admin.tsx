import { BookOpen, Package, Route as RouteIcon } from "lucide-react";
import { lazy, type ReactNode } from "react";

import type { AppRoute } from "../types";

const LazyTrajectoriesPage = lazy(() => import("@/pages/admin/trajectories"));
const LazyBoxesPage = lazy(() => import("@/pages/admin/boxes"));
const LazyCoursesPage = lazy(() => import("@/pages/admin/courses"));

// Single source of truth for both the router and the admin navbar — add a route
// here and it appears in the admin shell automatically. `protected` is what puts
// it behind the login gate; AppRouter groups on that flag.
export interface AdminRoute extends AppRoute {
  label: string;
  icon: ReactNode;
}

export const adminRoutes: AdminRoute[] = [
  {
    path: "admin/trajectories",
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
