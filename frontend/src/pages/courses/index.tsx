import { CourseCard, useCoursesQuery } from "@/entities/course";
import { useRoadmapStore } from "@/shared/store";

const CoursesPage = () => {
  const { passedIds, togglePassedId } = useRoadmapStore();
  const { data: courses = [] } = useCoursesQuery();

  return (
    <div className="flex flex-col w-full">
      <div className="text-xs uppercase font-semibold tracking-wide mb-2 text-muted-foreground">
        Траектория &gt; Каталог курсов
      </div>
      <h1 className="text-3xl font-extrabold mb-8 tracking-tight text-foreground">
        Курсы и навыки
      </h1>

      <div
        className="grid gap-6 w-full"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >
        {courses.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            allCourses={courses}
            passedIds={passedIds}
            isSelected={passedIds.includes(c.id)}
            onToggle={() => togglePassedId(c.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default CoursesPage;
