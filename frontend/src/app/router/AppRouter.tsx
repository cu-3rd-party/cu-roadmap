import { Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AdminLayout, MainLayout } from "@/app/layouts";
import { RequireAuth } from "@/features/auth";
import { PageLoader } from "@/shared/ui";

import { adminDetailRoutes, adminRoutes } from "./routes/admin";
import { fallbackRoutes } from "./routes/not-found";
import { publicRoutes } from "./routes/public";
import { sidebarRoutes } from "./routes/sidebar";

// Grouped by the `protected` flag rather than hardcoded, so an admin route
// declared without it is visibly public instead of silently inheriting the guard.
const guardedRoutes = adminRoutes.filter(
  ({ protected: isProtected }) => isProtected,
);

const HarnessLayout = () => (
  <MainLayout>
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  </MainLayout>
);

const AdminHarnessLayout = () => (
  <AdminLayout>
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  </AdminLayout>
);

export const AppRouter = () => (
  <Routes>
    {/* Outside every layout — that is what keeps the navbar off the login screen. */}
    {publicRoutes.map(({ path, element }) => (
      <Route
        key={path}
        path={path}
        element={<Suspense fallback={<PageLoader />}>{element}</Suspense>}
      />
    ))}

    <Route element={<RequireAuth />}>
      <Route element={<AdminHarnessLayout />}>
        <Route
          path="/admin"
          element={<Navigate to="/admin/specializations" replace />}
        />
        {guardedRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
        {adminDetailRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Route>
    </Route>

    <Route element={<HarnessLayout />}>
      <Route path="/" element={<Navigate to="/planner" replace />} />
      {sidebarRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
      {fallbackRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Route>
  </Routes>
);
