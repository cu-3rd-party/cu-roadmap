import React from "react";

interface SemesterSelectorProps {
  value: number;
  onChange: (sem: number) => void;
}

export function SemesterSelector({ value, onChange }: SemesterSelectorProps) {
  return (
    <div className="flex flex-col gap-2 w-44">
      <label
        className="text-xs font-bold uppercase"
        style={{ color: "var(--color-text-muted)" }}
      >
        Текущий семестр
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        min={1}
        max={8}
        className="w-full p-2.5 border rounded-lg text-base"
        style={{
          backgroundColor: "var(--color-bg-main)",
          color: "var(--color-text-main)",
          borderColor: "var(--color-border)",
        }}
      />
    </div>
  );
}
