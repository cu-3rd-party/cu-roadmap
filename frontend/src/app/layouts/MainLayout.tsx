import type { ReactNode } from "react";

import { GreetingModal } from "@/features/settings";
import { CourseDetailsDrawer } from "@/widgets/CourseDetailsDrawer";
import { Navbar } from "@/widgets/Navbar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <main className="flex-1 overflow-y-auto bg-background-alt px-2 lg:px-6 pt-2 lg:pt-8 pb-24 sm:pb-6 text-fg-primary scrollbar-gutter-stable">
        {children}
      </main>
      <GreetingModal />
      <CourseDetailsDrawer />
    </div>
  );
}
