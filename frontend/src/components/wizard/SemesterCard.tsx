import React from "react";

interface Course {
  id: string;
  title: string;
  type: string;
  workload: number;
}

interface SemesterCardProps {
  semester: {
    semester: number;
    total_load?: number;
    error?: string;
    courses: Course[];
  };
  fixPrereq?: (courseTitle: string) => void;
}

export function SemesterCard({ semester, fixPrereq }: SemesterCardProps) {
  const load = semester.total_load || 0;
  const isOverloaded = load > 12;
  const year = 24 + Math.floor((semester.semester - 1) / 2);
  const season = semester.semester % 2 === 1 ? "Осень" : "Весна";

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">
            {semester.semester}
          </div>
          <div>
            <h3 className="text-lg font-bold">Семестр {semester.semester}</h3>
            <span className="text-xs text-gray-500">
              {season} 20{year}
            </span>
          </div>
        </div>
        <div
          className={`text-sm font-bold px-3 py-1 rounded-lg ${
            isOverloaded
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {load.toFixed(1)} / 12 кредитов
        </div>
      </div>
      {semester.error && typeof semester.error === "string" && (
        <div className="mb-4">
          <button
            className="bg-red-500 text-white border-none px-2 py-1 rounded font-bold text-xs cursor-pointer ml-auto"
            onClick={() => semester.error && fixPrereq?.(semester.error)}
          >
            Исправить
          </button>
        </div>
      )}

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
      >
        {semester.courses.map((c: Course) => (
          <div
            key={c.id}
            className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm"
          >
            <div className="font-semibold text-sm mb-1">{c.title}</div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">
                {c.type}
              </span>
              <span className="text-xs text-gray-500">{c.workload} к.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
