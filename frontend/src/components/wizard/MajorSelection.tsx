import React from "react";

interface Major {
  id: string;
  title: string;
}

interface MajorSelectProps {
  majors: Major[];
  selectedMajor: string;
  onChange: (id: string) => void;
}

export function MajorSelect({
  majors,
  selectedMajor,
  onChange,
}: MajorSelectProps) {
  return (
    <div>
      <label
        className="text-sm font-bold mb-2 block"
        style={{ color: "var(--color-text-main)" }}
      >
        Целевое направление (Major)
      </label>
      <select
        value={selectedMajor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 border rounded-xl text-base"
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