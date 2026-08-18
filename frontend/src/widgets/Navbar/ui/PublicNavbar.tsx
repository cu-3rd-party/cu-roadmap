import {
  BookOpen,
  CircleQuestionMark,
  Compass,
  Map,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { useState } from "react";

import { useTheme } from "@/app/providers";
import { AboutModal } from "@/features/about";
import { SettingsModal } from "@/features/settings";
import { Button } from "@/shared/ui";

import { NavItem, themeToggleEnabled } from "../model";

import { BottomNavItem, Navbar } from "./Navbar";

const NAV_ITEMS: NavItem[] = [
  { label: "Глоссарий", icon: <BookOpen />, path: "/glossary" },
  { label: "Планировщик", icon: <Map />, path: "/planner" },
  { label: "Каталог", icon: <Compass />, path: "/catalog" },
] as const;

/* The public shell's navbar: owns its own items and the About/Settings state,
   so MainLayout stays a page frame. The modals live here beside the state that
   drives them — they portal out, so their position in the tree is immaterial. */
export const PublicNavbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <Navbar
        items={NAV_ITEMS}
        actions={
          <>
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
              onClick={() => setAboutOpen(true)}
              variant="navInactive"
              size="sm"
              icon={<CircleQuestionMark />}
              className="rounded-full"
              aria-label="О проекте"
            />

            <Button
              onClick={() => setSettingsOpen(true)}
              variant="navInactive"
              size="sm"
              icon={<Settings />}
              className="rounded-full"
              aria-label="Настройки"
            />
          </>
        }
        bottomLeading={
          <BottomNavItem
            label="О проекте"
            icon={<CircleQuestionMark />}
            onClick={() => setAboutOpen(true)}
          />
        }
        bottomTrailing={
          <BottomNavItem
            label="Настройки"
            icon={<Settings />}
            onClick={() => setSettingsOpen(true)}
          />
        }
      />

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
};
