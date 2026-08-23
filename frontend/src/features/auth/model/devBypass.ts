/* Dev-only escape hatch for the admin shell: `pnpm dev:noauth` sets VITE_NO_AUTH so the
   panel can be poked at without a session. This only opens the UI gate — the backend's
   AuthMiddleware still guards /api/v1, so admin requests keep answering 401.

   The `import.meta.env.DEV` half of the check is load-bearing twice over: it is statically
   false in `vite build`, so a production bundle tree-shakes the branch away and can never
   ship bypassed — and it must never be the *only* condition, because DEV is true under
   Vitest too, which would silently disable the guard in the auth tests. */
export const AUTH_BYPASSED =
  import.meta.env.DEV && import.meta.env.VITE_NO_AUTH === "true";
