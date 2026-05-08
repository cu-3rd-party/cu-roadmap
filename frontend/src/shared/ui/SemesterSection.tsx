import React from "react";

interface SemesterSectionProps {
  semester: number;
  children: React.ReactNode;
  totalLoad?: number;
}

export function SemesterSection({
  semester,
  children,
  totalLoad,
}: SemesterSectionProps) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        backgroundColor: "var(--color-bg-hover)",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold" style={{ color: "var(--color-text-main)" }}>
          Семестр {semester}
        </h3>
        {totalLoad !== undefined && (
          <span
            className="text-xs px-2 py-1 rounded font-semibold"
            style={{
              backgroundColor: "var(--color-bg-main)",
              color: "var(--color-text-muted)",
            }}
          >
            Нагрузка: {totalLoad.toFixed(1)}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}