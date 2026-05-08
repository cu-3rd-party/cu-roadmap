import React from "react";

interface SemesterSelectorProps {
  value: number;
  onChange: (sem: number) => void;
}

export function SemesterSelector({ value, onChange }: SemesterSelectorProps) {
  return (
    <div>
      <label
        className="text-sm font-bold mb-2 block"
        style={{ color: "var(--color-text-main)" }}
      >
        Семестр начала обучения
      </label>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
          <button
            key={sem}
            onClick={() => onChange(sem)}
            className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
              value === sem ? "" : "hover:border-gray-300"
            }`}
            style={
              value === sem
                ? {
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                    border: "none",
                  }
                : {
                    backgroundColor: "var(--color-bg-main)",
                    color: "var(--color-text-muted)",
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "var(--color-border)",
                  }
            }
          >
            Семестр {sem}
          </button>
        ))}
      </div>
      <p
        className="text-xs mt-2"
        style={{ color: "var(--color-text-muted)" }}
      >
        Укажите семестр, с которого хотите начать планирование траектории
      </p>
    </div>
  );
}