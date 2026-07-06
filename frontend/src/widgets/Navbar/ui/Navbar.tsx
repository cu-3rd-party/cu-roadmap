import {
  CircleQuestionMark,
  Compass,
  Map,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useTheme } from "@/app/providers";
import { SettingsModal } from "@/features/settings";
import { cn, isPathActive } from "@/shared/lib";
import { Button } from "@/shared/ui";

import { NavItem, themeToggleEnabled } from "../model";

interface BottomNavItemProps {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
}

const BottomNavItem = ({
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

const NAV_ITEMS: NavItem[] = [
  { label: "Глоссарий", icon: <CircleQuestionMark />, path: "/glossary" },
  { label: "Планировщик", icon: <Map />, path: "/planner" },
  { label: "Каталог", icon: <Compass />, path: "/catalog" },
] as const;

export const Navbar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <>
      <header className="relative hidden sm:flex h-16 items-center justify-between border-b border-border bg-background px-6">
        <img src="/favicon.svg" width={36} height={36} alt="ЦУ" />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 grid-flow-col auto-cols-fr items-center gap-4 rounded-full p-1 sm:grid">
          {NAV_ITEMS.map((item) => (
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

        <div className="hidden items-center gap-2 sm:flex">
          {themeToggleEnabled && (
            <Button
              onClick={toggleTheme}
              variant="navInactive"
              size="sm"
              icon={theme === "dark" ? <Sun /> : <Moon />}
              className="rounded-full"
              aria-label={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            />
          )}

          <Button
            onClick={() => setSettingsOpen(true)}
            variant="navInactive"
            size="sm"
            icon={<Settings />}
            className="rounded-full"
            aria-label="Настройки"
          />
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-background py-2 sm:hidden">
        {NAV_ITEMS.map((item) => (
          <BottomNavItem
            key={item.label}
            label={item.label}
            icon={item.icon}
            active={isPathActive(item.path)}
            onClick={() => navigate(item.path)}
          />
        ))}

        <BottomNavItem
          label="Настройки"
          icon={<Settings />}
          onClick={() => setSettingsOpen(true)}
        />
      </nav>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};
