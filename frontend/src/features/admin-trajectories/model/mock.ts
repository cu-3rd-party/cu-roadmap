import type { AdminSpecialization, MajorTab } from "./types";

/* Placeholder data for the trajectories entry screen. Swap both constants for
   the admin majors/specializations queries once those endpoints exist — nothing
   else in this feature knows where the data came from. */

export const MOCK_MAJOR_TABS: MajorTab[] = [
  { id: "dev", label: "Разработка" },
  { id: "ai", label: "ИИ" },
  { id: "business", label: "Бизнес" },
];

export const MOCK_SPECIALIZATIONS: AdminSpecialization[] = [
  { id: "system-development", majorId: "dev", title: "Системная разработка" },
  { id: "data-engineering", majorId: "dev", title: "Инженерия данных" },
];
