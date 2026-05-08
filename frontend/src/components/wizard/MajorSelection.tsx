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
      <label className="text-sm font-bold text-gray-700 mb-2 block">
        Целевое направление (Major)
      </label>
      <select
        value={selectedMajor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-base"
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
