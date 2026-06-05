import type { Course } from "@/entities/course";

export const getCourseHints = (
  courses: Course[] | undefined,
  query: string,
): Course[] => {
  const q = query.trim().toLowerCase();
  if (!q || !courses) return [];
  return courses
    .filter((course) => course.title.toLowerCase().includes(q))
    .slice(0, 5);
};
