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
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: "var(--color-bg-hover)",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
            style={{ backgroundColor: "var(--color-primary)", color: "white" }}
          >
            {semester.semester}
          </div>
          <div>
            <h3
              className="text-lg font-bold"
              style={{ color: "var(--color-text-main)" }}
            >
              Семестр {semester.semester}
            </h3>
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {season} 20{year}
            </span>
          </div>
        </div>
        <div
          className="text-sm font-bold px-3 py-1 rounded-lg"
          style={
            isOverloaded
              ? { backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444" }
              : { backgroundColor: "rgba(34,197,94,0.15)", color: "#22c55e" }
          }
        >
          {load.toFixed(1)} / 12 кредитов
        </div>
      </div>
      {semester.error && typeof semester.error === "string" && (
        <div className="mb-4">
          <button
            className="text-white border-none px-2 py-1 rounded font-bold text-xs cursor-pointer"
            style={{ backgroundColor: "#ef4444" }}
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
            className="rounded-xl p-3 shadow-sm"
            style={{
              backgroundColor: "var(--color-bg-main)",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "var(--color-border)",
            }}
          >
            <div
              className="font-semibold text-sm mb-1"
              style={{ color: "var(--color-text-main)" }}
            >
              {c.title}
            </div>
            <div className="flex gap-2 mt-2">
              <span
                className="text-xs px-2 py-0.5 rounded font-bold"
                style={{
                  backgroundColor: "var(--color-bg-hover)",
                  color: "var(--color-text-muted)",
                }}
              >
                {c.type}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {c.workload} к.
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
