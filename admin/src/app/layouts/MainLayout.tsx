import type { ReactNode } from "react";

import { Sidebar } from "@/widgets/Sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background-alt px-6 pt-8 pb-10 text-fg-primary scrollbar-gutter-stable">
        {children}
      </main>
    </div>
  );
}
