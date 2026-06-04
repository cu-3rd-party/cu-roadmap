import { ReactNode } from "react";

export interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
}

export const themeToggleEnabled = false;
