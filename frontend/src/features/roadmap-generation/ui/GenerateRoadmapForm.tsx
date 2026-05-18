import { Sparkles } from "lucide-react";

import type { Major } from "@/entities/major";
import { Button } from "@/shared/ui/kit/button";

import { AISparkleBox } from "./AISparkleBox";
import { MajorSelect } from "./MajorSelect";
import { SemesterSelector } from "./SemesterSelector";

interface GenerateRoadmapFormProps {
  majors: Major[];
  selectedMajor: string;
  onSelectedMajorChange: (id: string) => void;
  startSem: number;
  onStartSemChange: (sem: number) => void;
  isPending: boolean;
  onBack?: () => void;
  onGenerate: () => void;
}

export function GenerateRoadmapForm({
  majors,
  selectedMajor,
  onSelectedMajorChange,
  startSem,
  onStartSemChange,
  isPending,
  onBack,
  onGenerate,
}: GenerateRoadmapFormProps) {
  return (
    <div className="flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2 text-foreground">
          Настройка траектории
        </h2>
        <p className="text-muted-foreground">
          Выберите направление и укажите, когда вы поступили
        </p>
      </div>

      <div className="max-w-xl mx-auto rounded-2xl p-6 bg-muted w-full">
        <div className="flex flex-col gap-5">
          <MajorSelect
            majors={majors}
            selectedMajor={selectedMajor}
            onChange={onSelectedMajorChange}
          />
          <SemesterSelector value={startSem} onChange={onStartSemChange} />
          <AISparkleBox />
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-6">
        {onBack && (
          <Button variant="secondary" size="lg" onClick={onBack}>
            Назад
          </Button>
        )}
        <Button
          size="lg"
          onClick={onGenerate}
          disabled={isPending || !selectedMajor}
          className="shadow-lg"
        >
          <Sparkles size={18} />
          {isPending ? "Загрузка..." : "Построить траектории"}
        </Button>
      </div>
    </div>
  );
}
