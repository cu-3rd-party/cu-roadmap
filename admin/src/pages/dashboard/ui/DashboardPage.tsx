import { Card, CardDescription, CardHeader, CardTitle } from "@cu/ui/kit";

import { sidebarRoutes } from "@/app/router/routes/sidebar";

// Base shell only — real widgets land here as features get built out.
export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-fg-primary">Обзор</h1>
        <p className="text-sm text-fg-secondary">
          Панель администрирования CU Roadmap.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sidebarRoutes
          .filter(({ path }) => path !== "dashboard")
          .map(({ path, label, icon: Icon }) => (
            <Card key={path}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="size-4 text-fg-secondary" aria-hidden />
                  {label}
                </CardTitle>
                <CardDescription>Раздел пока не заполнен.</CardDescription>
              </CardHeader>
            </Card>
          ))}
      </div>
    </div>
  );
}
