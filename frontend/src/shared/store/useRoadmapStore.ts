import { create } from "zustand";

import type { RoadmapData } from "@/shared/config";

interface RoadmapState {
  passedIds: string[];
  setPassedIds: (updater: (prev: string[]) => string[]) => void;
  togglePassedId: (id: string) => void;

  roadmapData: RoadmapData | null;
  setRoadmapData: (data: RoadmapData | null) => void;
}

export const useRoadmapStore = create<RoadmapState>()((set) => ({
  passedIds: [],
  setPassedIds: (updater) =>
    set((state) => ({ passedIds: updater(state.passedIds) })),
  togglePassedId: (id) =>
    set((state) => ({
      passedIds: state.passedIds.includes(id)
        ? state.passedIds.filter((i) => i !== id)
        : [...state.passedIds, id],
    })),

  roadmapData: null,
  setRoadmapData: (data) => set({ roadmapData: data }),
}));
