import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { AdmissionYear } from "@/shared/constants";
import { UUID } from "@/shared/model";

interface SettingsState {
  hasSeenGreeting: boolean;
  admissionYear: AdmissionYear | null;
  hideCompletedSemesters: boolean;
  majorId: UUID | null;
  completeGreeting: (admissionYear: AdmissionYear) => void;
  setAdmissionYear: (admissionYear: AdmissionYear) => void;
  setMajorId: (majorId: UUID | null) => void;
  setHideCompletedSemesters: (hide: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hasSeenGreeting: false,
      admissionYear: null,
      hideCompletedSemesters: false,
      majorId: null,
      completeGreeting: (admissionYear) =>
        set({ hasSeenGreeting: true, admissionYear }),
      setAdmissionYear: (admissionYear) => set({ admissionYear }),
      setMajorId: (majorId) => set({ majorId }),
      setHideCompletedSemesters: (hide) =>
        set({ hideCompletedSemesters: hide }),
    }),
    {
      name: "settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hasSeenGreeting: state.hasSeenGreeting,
        admissionYear: state.admissionYear,
        majorId: state.majorId,
        hideCompletedSemesters: state.hideCompletedSemesters,
      }),
    },
  ),
);
