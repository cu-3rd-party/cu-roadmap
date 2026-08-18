import { lazy } from "react";

import type { AppRoute } from "../types";

const LazyLoginPage = lazy(() => import("@/pages/admin/login"));

// Reachable without a session, and rendered outside every layout so no navbar
// appears on it. Everything under adminRoutes is guarded instead.
export const publicRoutes: AppRoute[] = [
  { path: "admin/login", element: <LazyLoginPage /> },
];
