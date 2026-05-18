import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/app/providers";
import { Button } from "@/shared/ui/kit/button";

export function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const themeTitle = theme === "dark" ? "Светлая тема" : "Тёмная тема";

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 z-40">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-2.5 font-extrabold text-xs max-w-45 leading-tight text-foreground">
          <img src="/favicon.svg" width={32} height={32} />
          <div className="tracking-wide">CUMAP</div>
        </div>
        <nav className="hidden md:flex gap-1">
          <Button variant="ghost" size="sm" className="text-primary">
            Движок
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            disabled
          >
            More Soon...
          </Button>
        </nav>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        title={themeTitle}
        aria-label={themeTitle}
      >
        <ThemeIcon />
      </Button>
    </header>
  );
}
