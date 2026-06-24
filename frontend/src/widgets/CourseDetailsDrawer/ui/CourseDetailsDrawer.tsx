import { useMemo } from "react";

import {
  buildCourseTitleMap,
  courseToDetails,
  DetailsDrawer,
  useCourseDrawerStore,
  useCoursesQuery,
} from "@/entities/course";
import { useSpecializationsQuery } from "@/entities/specialization";
import { useSettingsStore } from "@/features/settings";

// Single, app-wide course details drawer.
export const CourseDetailsDrawer = () => {
  const { courseId, openCourse, close } = useCourseDrawerStore();
  const { admissionYear, majorId } = useSettingsStore();

  const { data: courses } = useCoursesQuery(admissionYear, majorId);
  const { data: specializations } = useSpecializationsQuery(majorId);

  const courseById = useMemo(
    () => new Map((courses ?? []).map((course) => [course.id, course])),
    [courses],
  );
  const titleMap = useMemo(() => buildCourseTitleMap(courses ?? []), [courses]);
  const specializationTitleMap = useMemo(
    () => new Map((specializations ?? []).map((s) => [s.id, s.title])),
    [specializations],
  );
  const navigableIds = useMemo(() => new Set(courseById.keys()), [courseById]);

  const course = useMemo(() => {
    if (!courseId) return undefined;
    const found = courseById.get(courseId);
    return found
      ? courseToDetails(found, { titleMap, specializationTitleMap })
      : undefined;
  }, [courseId, courseById, titleMap, specializationTitleMap]);

  return (
    <DetailsDrawer
      course={course}
      open={courseId != null}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      onNavigate={openCourse}
      navigableIds={navigableIds}
    />
  );
};
