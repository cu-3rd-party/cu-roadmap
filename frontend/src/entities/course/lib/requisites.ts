import {
  Bookmark,
  Lock,
  LockOpen,
  Spline,
  ArrowsUpFromLine,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

import type { Season } from "../model/details";

export type RequisiteType = "pre" | "co" | "post";

export const REQUISITE_LABELS: Record<RequisiteType, string> = {
  pre: "Пререквизит",
  co: "Кореквизит",
  post: "Постреквизит",
};

export const REQUISITE_ICONS: Record<RequisiteType, LucideIcon> = {
  pre: Bookmark,
  co: ArrowsUpFromLine,
  post: GraduationCap
};

export const SEASON_LABELS: Record<Season, string> = {
  autumn: "Осень",
  spring: "Весна",
};

export const SEASON_BADGE_VARIANT: Record<Season, "yellow" | "green"> = {
  autumn: "yellow",
  spring: "green",
};

export const REQUISITE_STATUS_ICONS: Record<"locked" | "unlocked", LucideIcon> =
  {
    locked: Lock,
    unlocked: LockOpen,
  };

export const REQUISITE_LINK_ICON: LucideIcon = Spline;
