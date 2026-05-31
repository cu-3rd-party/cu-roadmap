import { PlannerSummary } from "@/widgets/PlannerSummary";
import { SemesterSection } from "@/widgets/SemesterSection";

import { PLANNER_MAJORS, PLANNER_STATS, SEMESTERS } from "./model/mock";

const PlannerPage = () => {
  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-1">
      <PlannerSummary stats={PLANNER_STATS} majors={PLANNER_MAJORS} />

      {SEMESTERS.map((semester) => (
        <SemesterSection
          key={semester.index}
          index={semester.index}
          dateRange={semester.dateRange}
        />
      ))}
    </div>
  );
};

export default PlannerPage;
