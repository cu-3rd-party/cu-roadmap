import React, { useState } from "react";
import { Check, Search } from "lucide-react";
import { CourseCard } from "./CourseCard";

interface CourseSelectionProps {
  courses: any[];
  passedIds: string[];
  onToggleCourse: (id: string) => void;
}

export function CourseSelection({
  courses,
  passedIds,
  onToggleCourse,
}: CourseSelectionProps) {
  const [search, setSearch] = useState("");
  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Какие курсы вы уже прошли?</h2>
        <p className="text-gray-500">
          Отметьте курсы, которые вы изучали или планируете изучать
        </p>
      </div>

      <div className="relative max-w-md mx-auto mb-6">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Поиск курсов..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base"
        />
      </div>

      <div className="flex items-center gap-3 mb-4 px-4">
        <Check size={16} className="text-primary" />
        <span className="text-sm font-medium text-gray-600">
          Выбрано курсов: <strong>{passedIds.length}</strong>
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
            isSelected={passedIds.includes(c.id)}
            onToggle={() => onToggleCourse(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
