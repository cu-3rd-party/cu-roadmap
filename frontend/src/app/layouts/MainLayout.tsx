import type { ReactNode } from "react";

import { GreetingModal } from "@/features/settings";
import { Navbar } from "@/widgets/Navbar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <main className="flex-1 overflow-y-auto bg-background-alt px-6 py-8 text-fg-primary">
        {children}
      </main>
      <GreetingModal />
    </div>
  );
}
