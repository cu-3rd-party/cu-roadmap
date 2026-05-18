import { Check, Search } from "lucide-react";
import { useState } from "react";

import { CourseCard, type Course } from "@/entities/course";
import { useRoadmapStore } from "@/shared/store";
import { Input } from "@/shared/ui/kit/input";

interface PassedCoursesGridProps {
  courses: Course[];
}

export function PassedCoursesGrid({ courses }: PassedCoursesGridProps) {
  const { passedIds, togglePassedId } = useRoadmapStore();
  const [search, setSearch] = useState("");

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2 text-foreground">
          Какие курсы вы уже прошли?
        </h2>
        <p className="text-muted-foreground">
          Отметьте курсы, которые вы изучали или планируете изучать
        </p>
      </div>

      <div className="relative max-w-md mx-auto mb-6 w-full">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <Input
          type="text"
          placeholder="Поиск курсов..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      <div className="flex items-center gap-3 mb-4 px-4">
        <Check size={16} className="text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          Выбрано курсов:{" "}
          <strong className="text-foreground">{passedIds.length}</strong>
        </span>
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
      >
        {filtered.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            allCourses={courses}
            passedIds={passedIds}
            isSelected={passedIds.includes(c.id)}
            onToggle={() => togglePassedId(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
