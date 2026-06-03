import { useCoursesQuery } from "@/entities/course";
import { useSettingsStore } from "@/features/settings";
import { PlannerSummary } from "@/widgets/PlannerSummary";
import { SemesterSection } from "@/widgets/SemesterSection";

import { PLANNER_MAJORS, PLANNER_STATS, SEMESTERS } from "./model/mock";

const PlannerPage = () => {
  const { admissionYear } = useSettingsStore();
  const { data: courses, isLoading, isError } = useCoursesQuery(admissionYear);

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2">
      <PlannerSummary stats={PLANNER_STATS} majors={PLANNER_MAJORS} />

      {SEMESTERS.map((semester) => (
        <SemesterSection
          key={semester.index}
          index={semester.index}
          dateRange={semester.dateRange}
          courses={courses ?? []}
          coursesLoading={isLoading}
          coursesError={isError}
        />
      ))}
    </div>
  );
};

export default PlannerPage;
