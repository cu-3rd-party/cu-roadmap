import { Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { MainLayout } from "@/app/layouts";

import { fallbackRoutes } from "./routes/not-found";
import { sidebarRoutes } from "./routes/sidebar";

const PageLoader = () => <div className="p-10 text-center">Загрузка...</div>;

const HarnessLayout = () => (
  <MainLayout>
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  </MainLayout>
);

export const AppRouter = () => (
  <Routes>
    <Route element={<HarnessLayout />}>
      <Route path="/" element={<Navigate to="/catalog" replace />} />
      {sidebarRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Route>
    {fallbackRoutes.map(({ path, element }) => (
      <Route key={path} path={path} element={element} />
    ))}
  </Routes>
);
