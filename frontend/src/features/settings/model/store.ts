import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { AdmissionYear } from "@/shared/constants";
import { MajorType, UUID } from "@/shared/model";

interface SettingsState {
  hasSeenGreeting: boolean;
  admissionYear: AdmissionYear | null;
  hideCompletedSemesters: boolean;
  hideSpecializationCards: boolean;
  majorId: UUID | null;
  majorType: MajorType | null;
  completeGreeting: (admissionYear: AdmissionYear) => void;
  setAdmissionYear: (admissionYear: AdmissionYear) => void;
  setMajor: (majorId: UUID | null, majorType: MajorType | null) => void;
  setHideCompletedSemesters: (hide: boolean) => void;
  setHideSpecializationCards: (hide: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hasSeenGreeting: false,
      admissionYear: null,
      hideCompletedSemesters: false,
      hideSpecializationCards: false,
      majorId: null,
      majorType: null,
      completeGreeting: (admissionYear) =>
        set({ hasSeenGreeting: true, admissionYear }),
      setAdmissionYear: (admissionYear) => set({ admissionYear }),
      // id and type are always set together so they can't drift out of sync
      setMajor: (majorId, majorType) => set({ majorId, majorType }),
      setHideCompletedSemesters: (hide) =>
        set({ hideCompletedSemesters: hide }),
      setHideSpecializationCards: (hide) =>
        set({ hideSpecializationCards: hide }),
    }),
    {
      name: "settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hasSeenGreeting: state.hasSeenGreeting,
        admissionYear: state.admissionYear,
        majorId: state.majorId,
        majorType: state.majorType,
        hideCompletedSemesters: state.hideCompletedSemesters,
        hideSpecializationCards: state.hideSpecializationCards,
      }),
    },
  ),
);
