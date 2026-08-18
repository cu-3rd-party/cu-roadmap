import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { cn, isPathActive } from "@/shared/lib";
import { Button } from "@/shared/ui";

import { NavItem } from "../model";

interface BottomNavItemProps {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
}

export const BottomNavItem = ({
  label,
  icon,
  active,
  onClick,
}: BottomNavItemProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="group flex flex-1 cursor-pointer items-center justify-center"
  >
    <span
      className={cn(
        "flex size-12 items-center justify-center rounded-full text-fg-primary transition-colors duration-(--std-duration)",
        active ? "bg-accent-pale-hover" : "group-hover:bg-accent-pale-hover",
      )}
    >
      {icon}
    </span>
  </button>
);

interface NavbarProps {
  items: NavItem[];
  /* Trailing controls: the header's right-hand cluster on desktop. On mobile,
     `bottomLeading`/`bottomTrailing` flank the nav items in the bottom bar. */
  actions?: ReactNode;
  bottomLeading?: ReactNode;
  bottomTrailing?: ReactNode;
}

export const Navbar = ({
  items,
  actions,
  bottomLeading,
  bottomTrailing,
}: NavbarProps) => {
  const navigate = useNavigate();

  return (
    <>
      <header className="relative hidden md:flex h-16 items-center justify-between border-b border-border bg-background px-6">
        <img src="/favicon.svg" width={36} height={36} alt="ЦУ" />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 auto-cols-[minmax(min-content,1fr)] grid-flow-col items-center gap-4 rounded-full p-1 md:grid">
          {items.map((item) => (
            <Button
              key={item.label}
              onClick={() => navigate(item.path)}
              variant={isPathActive(item.path) ? "navActive" : "navInactive"}
              size="sm"
              icon={item.icon}
              className="w-full rounded-full"
            >
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">{actions}</div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-background py-2 md:hidden">
        {bottomLeading}

        {items.map((item) => (
          <BottomNavItem
            key={item.label}
            label={item.label}
            icon={item.icon}
            active={isPathActive(item.path)}
            onClick={() => navigate(item.path)}
          />
        ))}

        {bottomTrailing}
      </nav>
    </>
  );
};
