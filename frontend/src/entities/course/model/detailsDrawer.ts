import { create } from "zustand";

import type { UUID } from "@/shared/model";

// Drives the single app-wide course details drawer.
interface CourseDrawerState {
  courseId: UUID | null;
  openCourse: (id: UUID) => void;
  close: () => void;
}

export const useCourseDrawerStore = create<CourseDrawerState>((set) => ({
  courseId: null,
  openCourse: (id) => set({ courseId: id }),
  close: () => set({ courseId: null }),
}));
