import { useState } from "react";

import { useCoursesQuery } from "@/entities/course";
import { useMajorsQuery } from "@/entities/major";
import { SemesterCard } from "@/entities/roadmap";
import {
  MajorSelect,
  SemesterSelector,
  useFixPrereq,
  useGenerateRoadmapMutation,
} from "@/features/roadmap-generation";
import { useRoadmapStore } from "@/shared/store";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Separator } from "@/shared/ui/kit/separator";

const PlannerPage = () => {
  const { passedIds, roadmapData } = useRoadmapStore();
  const { data: courses = [] } = useCoursesQuery();
  const { data: majors = [] } = useMajorsQuery();

  const [selectedMajor, setSelectedMajor] = useState("");
  const [startSem, setStartSem] = useState(1);
  const { mutate, isPending } = useGenerateRoadmapMutation();

  const effectiveMajor = selectedMajor || majors[0]?.id || "";

  const generate = () => {
    if (!effectiveMajor) return;
    mutate({
      passed_course_ids: passedIds,
      major_id: effectiveMajor,
      current_semester: startSem,
      max_load: 12.0,
    });
  };

  const fixPrereq = useFixPrereq(courses, generate);

  const majorTitle =
    majors.find((m) => m.id === effectiveMajor)?.title || effectiveMajor;

  return (
    <div className="flex flex-col w-full">
      <div className="text-xs uppercase font-semibold tracking-wide mb-2 text-muted-foreground">
        Траектория &gt; Планировщик
      </div>
      <h1 className="text-3xl font-extrabold mb-8 tracking-tight text-foreground">
        Построение траектории
      </h1>
      <p className="mb-5 text-muted-foreground">
        Укажите мейджор и семестр, с которого вы хотите начать планирование.
      </p>

      <div className="flex gap-6 items-end pb-6 border-b border-border">
        <div className="flex-1">
          <MajorSelect
            majors={majors}
            selectedMajor={effectiveMajor}
            onChange={setSelectedMajor}
          />
        </div>
        <SemesterSelector value={startSem} onChange={setStartSem} />
        <Button onClick={generate} disabled={isPending || !effectiveMajor}>
          {isPending ? "Строим..." : "Рассчитать"}
        </Button>
      </div>

      {roadmapData?.roadmap && (
        <div className="flex flex-col gap-8 mt-10">
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm font-bold border-primary text-primary"
            >
              План для: {majorTitle}
            </Badge>
            <Separator className="flex-1" />
          </div>
          {roadmapData.roadmap.map((sem, idx) => (
            <SemesterCard
              key={idx}
              semester={sem}
              fixPrereq={fixPrereq}
              allCourses={courses}
              passedIds={passedIds}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlannerPage;
