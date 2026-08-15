import { cn } from "@cu/ui/lib";
import { NavLink } from "react-router-dom";

import { sidebarRoutes } from "@/app/router/routes/sidebar";

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-1 border-r border-border bg-elevation-01 px-3 py-4">
      <div className="px-3 pb-4">
        <span className="text-base font-semibold text-fg-primary">
          CU Roadmap
        </span>
        <span className="block text-xs text-fg-secondary">Админка</span>
      </div>

      <nav className="flex flex-col gap-0.5">
        {sidebarRoutes.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={`/${path}`}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent-pale font-medium text-fg-primary"
                  : "text-fg-secondary hover:bg-elevation-01-hover hover:text-fg-primary",
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
