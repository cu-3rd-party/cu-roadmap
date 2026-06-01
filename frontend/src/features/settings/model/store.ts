import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { AdmissionYear } from "@/shared/constants";

interface SettingsState {
  hasSeenGreeting: boolean;
  year: AdmissionYear | null;
  completeGreeting: (year: AdmissionYear) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hasSeenGreeting: false,
      year: null,
      completeGreeting: (year) => set({ hasSeenGreeting: true, year }),
    }),
    {
      name: "settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hasSeenGreeting: state.hasSeenGreeting,
        year: state.year,
      }),
    },
  ),
);
