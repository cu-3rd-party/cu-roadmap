import { Check } from "lucide-react";
import { SemesterCard } from "@/widgets/SemesterCard";
import type { SemesterData } from "@/shared/config";

interface RoadmapResultProps {
  roadmap: SemesterData[];
  onReset: () => void;
  onEditSettings: () => void;
  fixPrereq?: (courseTitle: string) => void;
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
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-3"
          style={{
            backgroundColor: "rgba(34,197,94,0.15)",
            color: "#22c55e",
          }}
        >
          <Check size={16} /> Траектория построена
        </div>
        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--color-text-main)" }}
        >
          Ваш план обучения
        </h2>
        <p className="mt-1" style={{ color: "var(--color-text-muted)" }}>
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
          className="flex items-center gap-2 border-none px-5 py-3 rounded-xl font-bold text-sm cursor-pointer transition-colors"
          style={{
            backgroundColor: "var(--color-bg-hover)",
            color: "var(--color-text-main)",
          }}
        >
          Начать заново
        </button>
        <button
          onClick={onEditSettings}
          className="flex items-center gap-2 text-white border-none px-5 py-3 rounded-xl font-bold text-sm cursor-pointer transition-colors"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Изменить настройки
        </button>
      </div>
    </div>
  );
}
