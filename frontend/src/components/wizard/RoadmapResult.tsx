import { Check } from "lucide-react";
import { SemesterCard } from "./SemesterCard";
import React from "react";

export interface SemesterData {
  semester: number;
  total_load?: number;
  error?: string;
  courses: { id: string; title: string; type: string; workload: number }[];
}

interface RoadmapResultProps {
  roadmap: SemesterData[];
  onReset: () => void;
  onEditSettings: () => void;
  fixPrereq: (courseTitle: string) => void;
}

export function RoadmapResult({
  roadmap,
  onReset,
  onEditSettings,
  fixPrereq,
}: RoadmapResultProps) {
  return (
    <div className="flex flex-col">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold mb-3">
          <Check size={16} /> Траектория построена
        </div>
        <h2 className="text-2xl font-bold">Ваш план обучения</h2>
        <p className="text-gray-500 mt-1">
          Рекомендуемая последовательность курсов по семестрам
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {roadmap.map((sem, idx) => (
          <SemesterCard key={idx} semester={sem} fixPrereq={fixPrereq} />
        ))}
      </div>

      <div className="flex justify-center mt-8 gap-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 border-none px-5 py-3 rounded-xl font-bold text-sm cursor-pointer hover:bg-gray-200 transition-colors"
        >
          Начать заново
        </button>
        <button
          onClick={onEditSettings}
          className="flex items-center gap-2 bg-primary text-white border-none px-5 py-3 rounded-xl font-bold text-sm cursor-pointer hover:bg-blue-600 transition-colors"
        >
          Изменить настройки
        </button>
      </div>
    </div>
  );
}
