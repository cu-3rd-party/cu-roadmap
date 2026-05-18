import { Check } from "lucide-react";

import type { Course } from "@/entities/course";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";

import type { SemesterData } from "../model";

import { SemesterCard } from "./SemesterCard";

interface RoadmapResultProps {
  roadmap: SemesterData[];
  onReset: () => void;
  onEditSettings: () => void;
  fixPrereq?: (courseTitle: string) => void;
  allCourses: Course[];
  passedIds: string[];
}

export function RoadmapResult({
  roadmap,
  onReset,
  onEditSettings,
  fixPrereq,
  allCourses,
  passedIds,
}: RoadmapResultProps) {
  return (
    <div className="flex flex-col">
      <div className="text-center mb-6">
        <Badge className="mb-3 px-4 py-2 text-sm bg-green-badge text-green-badge-foreground">
          <Check size={16} className="mr-1" /> Траектория построена
        </Badge>
        <h2 className="text-2xl font-bold text-foreground">
          Ваш план обучения
        </h2>
        <p className="mt-1 text-muted-foreground">
          Рекомендуемая последовательность курсов по семестрам
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {roadmap.map((sem, idx) => (
          <SemesterCard
            key={idx}
            semester={sem}
            fixPrereq={fixPrereq}
            allCourses={allCourses}
            passedIds={passedIds}
          />
        ))}
      </div>

      <div className="flex justify-center mt-8 gap-4">
        <Button variant="secondary" size="lg" onClick={onReset}>
          Начать заново
        </Button>
        <Button size="lg" onClick={onEditSettings}>
          Изменить настройки
        </Button>
      </div>
    </div>
  );
}
