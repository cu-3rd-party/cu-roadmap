import React from "react";
import type { Course } from "@/shared/config";

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
  return (
    <div
      className="rounded-2xl p-6 min-h-[200px]"
      style={{
        backgroundColor: "var(--color-bg-hover)",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold" style={{ color: "var(--color-text-main)" }}>
          Семестр {semester.semester}
        </h3>
        <span
          className="text-xs px-2 py-1 rounded font-semibold"
          style={{
            backgroundColor: "var(--color-bg-main)",
            color: "var(--color-text-muted)",
          }}
        >
          Нагрузка: {(semester.total_load || 0).toFixed(1)} / 12.0
        </span>
      </div>

      {semester.error && typeof semester.error === "string" && (
        <div className="text-sm mt-2" style={{ color: "#ef4444" }}>
          <span>⚠️ {semester.error}</span>
          {fixPrereq &&
            (semester.error.includes("пререквизиты") ||
              semester.error.includes("prereqs")) && (
              <button
                className="text-white border-none px-2 py-1 rounded text-xs font-bold cursor-pointer ml-2"
                style={{ backgroundColor: "#ef4444" }}
                onClick={() => fixPrereq(semester.error!)}
              >
                ИСПРАВИТЬ
              </button>
            )}
        </div>
      )}

      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        }}
      >
        {semester.courses.map((c) => (
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
            <strong className="font-semibold" style={{ color: "var(--color-text-main)" }}>
              {c.title}
            </strong>
            <div className="flex gap-2 mt-1">
              {c.type && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-bold"
                  style={{
                    backgroundColor: "var(--color-bg-hover)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {c.type}
                </span>
              )}
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {c.workload} к.
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}