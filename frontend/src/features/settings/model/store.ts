import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { AdmissionYear } from "@/shared/constants";

interface SettingsState {
  hasSeenGreeting: boolean;
  admissionYear: AdmissionYear | null;
  hideCompletedSemesters: boolean;
  completeGreeting: (admissionYear: AdmissionYear) => void;
  setAdmissionYear: (admissionYear: AdmissionYear) => void;
  setHideCompletedSemesters: (hide: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hasSeenGreeting: false,
      admissionYear: null,
      hideCompletedSemesters: false,
      completeGreeting: (admissionYear) =>
        set({ hasSeenGreeting: true, admissionYear }),
      setAdmissionYear: (admissionYear) => set({ admissionYear }),
      setHideCompletedSemesters: (hide) =>
        set({ hideCompletedSemesters: hide }),
    }),
    {
      name: "settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hasSeenGreeting: state.hasSeenGreeting,
        admissionYear: state.admissionYear,
        hideCompletedSemesters: state.hideCompletedSemesters,
      }),
    },
  ),
);
