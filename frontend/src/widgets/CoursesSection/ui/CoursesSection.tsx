import { Course, CourseCard } from "@/entities/course";
import { CollapsiblePanel, Panel } from "@/shared/ui/panel";

interface CourseCategorySectionProps {
  title: string;
  courses: Course[];
  panelTitle?: string;
}

export const CoursesSection = ({
  title,
  courses,
  panelTitle,
}: CourseCategorySectionProps) => {
  return (
    <Panel className="px-2 sm:px-4 lg:px-6">
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <h2 className="text-lg font-bold text-fg-primary">{title}</h2>
      </div>

      <CollapsiblePanel title={panelTitle}>
        <div className="grid gap-1 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              variant="catalog"
              courseId={course.id}
              title={course.title}
              recommendedSemester={course.recommendedSemester}
              category={course.category}
              type={course.type}
            />
          ))}
        </div>
      </CollapsiblePanel>
    </Panel>
  );
};
