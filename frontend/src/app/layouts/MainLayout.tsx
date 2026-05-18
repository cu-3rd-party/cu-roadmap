import type { ReactNode } from "react";

import { AppHeader } from "@/widgets/AppHeader";
import { AppSidebar } from "@/widgets/AppSidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <div className="flex flex-1 w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 w-full overflow-y-auto p-10 flex flex-col bg-background text-foreground">
          {children}
        </main>
      </div>
    </div>
  );
}
