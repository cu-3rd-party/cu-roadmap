import {
  Book,
  Calculator,
  Calendar,
  Network as NetworkIcon,
  Search,
  Target,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  path: string;
  icon: LucideIcon;
  title: string;
}

export const navItems: NavItem[] = [
  { path: "/wizard", icon: Wand2, title: "Траектория" },
  { path: "/courses", icon: Book, title: "Каталог" },
  { path: "/planner", icon: Calendar, title: "Планировщик" },
  { path: "/graph", icon: NetworkIcon, title: "Карта связей" },
  { path: "/calculator", icon: Calculator, title: "Калькулятор" },
  { path: "/goal", icon: Target, title: "Планирование" },
  { path: "/manual", icon: Search, title: "Песочница" },
];
