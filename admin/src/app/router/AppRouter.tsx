import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { MainLayout } from "@/app/layouts";

import { fallbackRoutes } from "./routes/not-found";
import { sidebarRoutes } from "./routes/sidebar";

const PageLoader = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-fg-secondary">
    <Loader2 className="size-8 animate-spin" aria-hidden />
    <span className="text-sm">Загрузка...</span>
  </div>
);

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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      {sidebarRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
      {fallbackRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Route>
  </Routes>
);
