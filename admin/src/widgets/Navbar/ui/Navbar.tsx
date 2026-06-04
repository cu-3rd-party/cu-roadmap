import { Compass, Map, Moon, Settings, Sun } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useTheme } from "@/app/providers";
import { SettingsModal } from "@/features/settings";
import { isPathActive } from "@/shared/lib";
import { Button } from "@/shared/ui/kit/button";

const NAV_ITEMS = [
  { label: "Планировщик", active: false, icon: <Map />, path: "/planner" },
  {
    label: "Каталог курсов",
    active: true,
    icon: <Compass />,
    path: "/catalog",
  },
  { label: "Админка", active: false, icon: <Settings />, path: "/admin" },
] as const;

export const Navbar = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <header className="relative flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <img src="/cu.svg" width={36} height={36} alt="ЦУ" />

      <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full p-1">
        {NAV_ITEMS.map((item) => (
          <Button
            key={item.label}
            onClick={() => navigate(item.path)}
            variant={isPathActive(item.path) ? "navActive" : "navInactive"}
            size="sm"
            icon={item.icon}
            className="rounded-full"
          >
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Button
          onClick={toggleTheme}
          variant="navInactive"
          size="sm"
          icon={theme === "dark" ? <Sun /> : <Moon />}
          className="rounded-full"
          aria-label={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
        />

        <Button
          onClick={() => setSettingsOpen(true)}
          variant="navInactive"
          size="sm"
          icon={<Settings />}
          className="rounded-full"
          aria-label="Настройки"
        />
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
};
