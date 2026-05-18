import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/shared/ui/kit/button";

import { navItems } from "./nav-items";

function useNavItems() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return navItems.map((item) => ({
    ...item,
    active: pathname === item.path || pathname.startsWith(`${item.path}/`),
    onClick: () => navigate(item.path),
  }));
}

export function AppSidebar() {
  const items = useNavItems();

  return (
    <>
      <aside className="hidden md:flex w-56 min-w-56 border-r border-border bg-sidebar flex-col items-stretch pt-5 pb-5 px-3 gap-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.path}
              variant={item.active ? "secondary" : "ghost"}
              size="lg"
              onClick={item.onClick}
              className="justify-start gap-2.5 w-full"
            >
              <Icon />
              <span>{item.title}</span>
            </Button>
          );
        })}
      </aside>

      <aside className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-sidebar flex flex-row items-center gap-1 px-2 z-40 overflow-x-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.path}
              variant={item.active ? "secondary" : "ghost"}
              size="icon"
              onClick={item.onClick}
              title={item.title}
              aria-label={item.title}
            >
              <Icon />
            </Button>
          );
        })}
      </aside>
    </>
  );
}
