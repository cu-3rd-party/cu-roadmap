import { CourseCard } from "@/entities/course";
import { CollapsiblePanel, Panel } from "@/shared/ui/panel";

export interface CategoryCourse {
  id: string;
  title: string;
}

interface CourseCategorySectionProps {
  title: string;
  selected: number;
  total: number;
  courses: CategoryCourse[];
  panelTitle?: string;
}

export const CoursesSection = ({
  title,
  courses,
  panelTitle = "Выбери 5 курсов из категории",
}: CourseCategorySectionProps) => {
  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <h2 className="text-lg font-bold text-fg-primary">{title}</h2>
      </div>

      <CollapsiblePanel title={panelTitle}>
        <div className="grid gap-1 sm:grid-cols-4 lg:grid-cols-6">
          {courses.map((course) => (
            <CourseCard key={course.id} title={course.title} />
          ))}
        </div>
      </CollapsiblePanel>
    </Panel>
  );
}
