import { Course, CourseCard, courseToDetails } from "@/entities/course";
import type { UUID } from "@/shared/model";
import { CollapsiblePanel, Panel } from "@/shared/ui/panel";

interface CourseCategorySectionProps {
  title: string;
  courses: Course[];
  titleMap: Map<UUID, string>;
  majorTitleMap: Map<UUID, string>;
  panelTitle?: string;
}

export const CoursesSection = ({
  title,
  courses,
  titleMap,
  majorTitleMap,
  panelTitle,
}: CourseCategorySectionProps) => {
  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <h2 className="text-lg font-bold text-fg-primary">{title}</h2>
      </div>

      <CollapsiblePanel title={panelTitle}>
        <div className="grid gap-1 sm:grid-cols-4 lg:grid-cols-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              title={course.title}
              recommendedSemester={course.recommendedSemester}
              category={course.category}
              type={course.type}
              details={courseToDetails(course, { titleMap, majorTitleMap })}
            />
          ))}
        </div>
      </CollapsiblePanel>
    </Panel>
  );
};
