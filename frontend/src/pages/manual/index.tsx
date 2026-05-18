import { useCoursesQuery } from "@/entities/course";
import {
  SemesterEditor,
  useManualRoadmapState,
  useValidateRoadmapMutation,
} from "@/features/manual-planning";
import { useRoadmapStore } from "@/shared/store";
import { Button } from "@/shared/ui/kit/button";

const ManualPage = () => {
  const { passedIds } = useRoadmapStore();
  const { data: courses = [] } = useCoursesQuery();
  const { roadmap, addCourse, removeCourse } = useManualRoadmapState();
  const {
    mutate,
    data: validation = [],
    isPending,
  } = useValidateRoadmapMutation();

  const validate = () => {
    mutate({
      passed_course_ids: passedIds,
      roadmap,
      max_load: 12.0,
    });
  };

  return (
    <div className="flex flex-col w-full">
      <h1 className="text-3xl font-extrabold text-foreground">
        Песочница (Ручное планирование)
      </h1>
      <p className="mb-6 text-muted-foreground">
        Расставьте курсы по семестрам самостоятельно и проверьте план на
        корректность.
      </p>

      <div className="mb-6">
        <Button onClick={validate} disabled={isPending}>
          {isPending ? "Проверяем..." : "Проверить план"}
        </Button>
      </div>

      <div className="flex flex-col gap-8">
        {roadmap.map((sem, idx) => (
          <SemesterEditor
            key={idx}
            semester={sem}
            semesterIndex={idx}
            courses={courses}
            allRoadmap={roadmap}
            validation={validation.find((v) => v.semester === sem.semester)}
            onAdd={addCourse}
            onRemove={removeCourse}
          />
        ))}
      </div>
    </div>
  );
};

export default ManualPage;
