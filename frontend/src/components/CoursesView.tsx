import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../consts";
import { Search } from "lucide-react";

export function CoursesView({ passedIds, setPassedIds }: any) {
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios.get(`${API_BASE}/courses/`).then((res) => setCourses(res.data));
  }, []);

  const toggleCourse = (id: string) => {
    setPassedIds((prev: string[]) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("stem")) return "#4B9B9B";
    if (cat.includes("business")) return "#FF7E3D";
    if (cat.includes("tech")) return "#00A3FF";
    if (cat.includes("soft")) return "#C0EB00";
    return "#8B5CF6";
  };

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col w-full">
      <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-2">
        Траектория &gt; Каталог курсов
      </div>
      <h1 className="text-3xl font-extrabold mb-8 text-gray-900 tracking-tight">
        Курсы и навыки
      </h1>

      <div
        className="grid gap-6 w-full"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >
        {filtered.map((c) => (
          <div
            key={c.id}
            className={`bg-white rounded-2xl overflow-hidden cursor-pointer border transition-all hover:-translate-y-1 hover:shadow-lg select-none ${passedIds.includes(c.id) ? "border-primary border-2" : "border-gray-100"}`}
            onClick={() => toggleCourse(c.id)}
          >
            <div
              className="h-36 relative"
              style={{ backgroundColor: getCategoryColor(c.category) }}
            >
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 200 120"
                opacity="0.4"
              >
                <path
                  d="M20 60 Q100 20 180 60"
                  stroke="white"
                  fill="none"
                  strokeWidth="1"
                />
                <path
                  d="M20 70 Q100 30 180 70"
                  stroke="white"
                  fill="none"
                  strokeWidth="1"
                />
                <path
                  d="M20 80 Q100 40 180 80"
                  stroke="white"
                  fill="none"
                  strokeWidth="1"
                />
              </svg>
              <div className="absolute bottom-3 right-3 bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                <Search size={14} color={getCategoryColor(c.category)} />
              </div>
            </div>
            <div className="p-4">
              <div className="font-bold text-base mb-1 text-gray-900 leading-snug">
                {c.title}
              </div>
              <div className="text-xs font-medium text-gray-500">
                {c.category} • {c.workload} к.
              </div>
            </div>
            {passedIds.includes(c.id) && (
              <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-extrabold">
                ПРОЙДЕНО
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
