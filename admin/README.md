# cu-roadmap admin

Admin panel for cu-roadmap. Served behind nginx at `/admin/`.

This app was rebuilt from scratch on the same architecture as `frontend/`, on
top of the shared design system in [`packages/ui`](../packages/ui). It is
currently a **base shell** — routing, providers, layout and the design system
are wired; the feature pages are placeholders.

## Layout

```
src/
  app/
    layouts/     MainLayout — sidebar + scrollable content
    providers/   QueryProvider; ThemeProvider re-exported from @cu/ui
    router/      AppRouter + routes/ (sidebar.tsx is the single source
                 of truth for both the routes and the sidebar nav)
    pwa/         PwaUpdater
    mocks/       MSW worker
    styles/      imports @cu/ui/styles.css, declares this app's @source
  pages/         dashboard, courses, restrictions, not-found
  shared/        api/ (axios client + error mapping), lib/, ui/ (barrel
                 re-exporting @cu/ui plus admin-only bits)
  widgets/       Sidebar
```

## Adding a page

Add an entry to `src/app/router/routes/sidebar.tsx` — it feeds both the router
and the sidebar nav, so the page appears in the shell automatically.

## Commands

Run from the repo root (this is a pnpm workspace member):

```bash
pnpm --filter cu-roadmap-frontend-admin dev      # vite dev server on :5174
pnpm --filter cu-roadmap-frontend-admin build
pnpm --filter cu-roadmap-frontend-admin test
pnpm --filter cu-roadmap-frontend-admin lint
```

Ports: dev `5174` (so it can run beside the public app on `5173`); in the
container it serves `5173`, which is what nginx proxies to.
