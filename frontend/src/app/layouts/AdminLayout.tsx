import type { ReactNode } from "react";

import { AdminNavbar } from "@/widgets/Navbar";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      <AdminNavbar />
      <main className="flex-1 overflow-y-auto bg-background-alt px-2 lg:px-6 pt-2 lg:pt-8 pb-24 md:pb-6 text-fg-primary scrollbar-gutter-stable">
        {children}
      </main>
    </div>
  );
}
