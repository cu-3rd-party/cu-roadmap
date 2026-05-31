import { Compass, Map } from "lucide-react";

import { Button } from "@/shared/ui/kit/button";

const NAV_ITEMS = [
  { label: "Каталог курсов", active: true, icon: <Compass /> },
  { label: "Планировщик", active: false, icon: <Map /> },
] as const;

export const CatalogNav = () => {
  return (
    <header className="relative flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <img src="/cu.svg" width={36} height={36} alt="ЦУ" />

      <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full p-1">
        {NAV_ITEMS.map((item) => (
          <Button
            key={item.label}
            variant="nav"
            size="sm"
            icon={item.icon}
            className="rounded-full"
          >
            
            {item.label}
          </Button>
        ))}
      </nav>
    </header>
  );
};
