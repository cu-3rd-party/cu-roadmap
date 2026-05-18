import type { Course } from "@/entities/course";
import { useRoadmapStore } from "@/shared/store";

export function useFixPrereq(courses: Course[], regenerate: () => void) {
  const { passedIds, setPassedIds } = useRoadmapStore();

  return (courseTitle: string) => {
    const target = courses.find((c) => courseTitle.includes(c.title));
    if (target && !passedIds.includes(target.id)) {
      setPassedIds((prev) => [...prev, target.id]);
      setTimeout(regenerate, 100);
    }
  };
}
