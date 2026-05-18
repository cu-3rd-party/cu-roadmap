import { useState } from "react";

import { useCoursesQuery } from "@/entities/course";
import { SemesterCard } from "@/entities/roadmap";
import {
  TargetCourseSelect,
  useGenerateGoalPathMutation,
} from "@/features/goal-path";
import { useRoadmapStore } from "@/shared/store";
import { Button } from "@/shared/ui/kit/button";

const GoalPage = () => {
  const { passedIds } = useRoadmapStore();
  const { data: courses = [] } = useCoursesQuery();
  const [targetId, setTargetId] = useState("");
  const {
    mutate,
    data: roadmap = [],
    isPending,
  } = useGenerateGoalPathMutation();

  const generate = () => {
    if (!targetId) return;
    mutate({
      target_course_id: targetId,
      passed_course_ids: passedIds,
      current_semester: 1,
      max_load: 12.0,
    });
  };

  return (
    <div className="flex flex-col w-full">
      <h1 className="text-3xl font-extrabold text-foreground">
        Планирование от цели
      </h1>
      <p className="mb-6 text-muted-foreground">
        Выберите курс, который вы хотите пройти в будущем, и система построит
        кратчайший путь до него.
      </p>

      <div className="flex gap-6 items-end pb-6 border-b border-border">
        <TargetCourseSelect
          courses={courses}
          value={targetId}
          onChange={setTargetId}
        />
        <Button onClick={generate} disabled={isPending || !targetId}>
          {isPending ? "Строим..." : "Построить путь"}
        </Button>
      </div>

      {roadmap.length > 0 && (
        <div className="flex flex-col gap-8 mt-10">
          {roadmap.map((sem, idx) => (
            <SemesterCard
              key={idx}
              semester={sem}
              allCourses={courses}
              passedIds={passedIds}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalPage;
