import React, { useEffect, useState } from "react";
import { api, type Course } from "@/shared/config";
import { CourseCard } from "../wizard/ui/CourseCard";

interface CoursesPageProps {
  passedIds: string[];
  setPassedIds: React.Dispatch<React.SetStateAction<string[]>>;
}
export function CoursesPage({ passedIds, setPassedIds }: CoursesPageProps) {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    api.getCourses().then((res) => setCourses(res.data));
  }, []);

  const toggleCourse = (id: string) => {
    setPassedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="flex flex-col w-full">
      <div
        className="text-xs uppercase font-semibold tracking-wide mb-2"
        style={{ color: "var(--color-text-muted)" }}
      >
        Траектория &gt; Каталог курсов
      </div>
      <h1
        className="text-3xl font-extrabold mb-8 tracking-tight"
        style={{ color: "var(--color-text-main)" }}
      >
        Курсы и навыки
      </h1>

      <div
        className="grid gap-6 w-full"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >
        {courses.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            allCourses={courses}
            passedIds={passedIds}
            isSelected={passedIds.includes(c.id)}
            onToggle={() => toggleCourse(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
