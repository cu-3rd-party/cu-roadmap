import React from "react";

interface SemesterSelectorProps {
  value: number;
  onChange: (sem: number) => void;
}

export function SemesterSelector({ value, onChange }: SemesterSelectorProps) {
  return (
    <div>
      <label className="text-sm font-bold text-gray-700 mb-2 block">
        Семестр начала обучения
      </label>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
          <button
            key={sem}
            onClick={() => onChange(sem)}
            className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
              value === sem
                ? "bg-primary text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            Семестр {sem}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Укажите семестр, с которого хотите начать планирование траектории
      </p>
    </div>
  );
}
