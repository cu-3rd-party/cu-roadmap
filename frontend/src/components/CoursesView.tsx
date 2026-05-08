import React from "react";
import { getCategoryColor } from "./wizard/helpers";
import { Search } from "lucide-react";

interface CoursesViewProps {
  passedIds: string[];
  setPassedIds: React.Dispatch<React.SetStateAction<string[]>>;
}

interface Course {
  id: string;
  title: string;
  category: string;
  workload: number;
}

export function CoursesView({ passedIds, setPassedIds }: CoursesViewProps) {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [search] = React.useState("");

  React.useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/courses/`)
      .then((res) => res.json())
      .then((data) => setCourses(data));
  }, []);

  const toggleCourse = (id: string) => {
    setPassedIds((prev: string[]) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

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
        {filtered.map((c) => (
          <div
            key={c.id}
            className={`rounded-2xl overflow-hidden cursor-pointer border transition-all hover:-translate-y-1 hover:shadow-lg select-none ${
              passedIds.includes(c.id) ? "border-2" : ""
            }`}
            style={{
              backgroundColor: "var(--color-bg-main)",
              borderColor: passedIds.includes(c.id)
                ? "var(--color-primary)"
                : "var(--color-border)",
            }}
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
              <div
                className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundColor: "var(--color-bg-main)" }}
              >
                <Search size={14} color={getCategoryColor(c.category)} />
              </div>
            </div>
            <div className="p-4">
              <div
                className="font-bold text-base mb-1 leading-snug"
                style={{ color: "var(--color-text-main)" }}
              >
                {c.title}
              </div>
              <div
                className="text-xs font-medium"
                style={{ color: "var(--color-text-muted)" }}
              >
                {c.category} • {c.workload} к.
              </div>
            </div>
            {passedIds.includes(c.id) && (
              <div
                className="absolute top-3 left-3 px-2 py-1 rounded text-xs font-extrabold"
                style={{
                  backgroundColor: "rgba(0,0,0,0.7)",
                  color: "white",
                }}
              >
                ПРОЙДЕНО
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}