import React from "react";

interface MajorSelectProps {
  majors: { id: string; title: string; name?: string }[];
  selectedMajor: string;
  onChange: (id: string) => void;
}

export function MajorSelect({ majors, selectedMajor, onChange }: MajorSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-xs font-bold uppercase"
        style={{ color: "var(--color-text-muted)" }}
      >
        Целевое направление (Major)
      </label>
      <select
        value={selectedMajor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2.5 border rounded-lg text-base"
        style={{
          backgroundColor: "var(--color-bg-main)",
          color: "var(--color-text-main)",
          borderColor: "var(--color-border)",
        }}
      >
        {majors.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title}
          </option>
        ))}
      </select>
    </div>
  );
}