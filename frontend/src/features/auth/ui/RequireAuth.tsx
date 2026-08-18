import { Navigate, Outlet, useLocation } from "react-router-dom";

import { PageLoader } from "@/shared/ui";

import { useAuthStatus } from "../model/useAuth";

/* Gate for every protected route. The API is already closed by the backend's
   AuthMiddleware — this only decides what the shell shows, and hands the
   attempted location to the login page so it can bounce back after signing in. */
export function RequireAuth() {
  const { data: authorized, isPending } = useAuthStatus();
  const location = useLocation();

  if (isPending) return <PageLoader />;

  if (!authorized) {
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    );
  }

  return <Outlet />;
}
