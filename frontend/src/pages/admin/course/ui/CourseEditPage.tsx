import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { buildCourseTitleMap, useCourseByIdQuery } from "@/entities/course";
import {
  CourseEditHeader,
  CourseRequisitesPanel,
  CourseSettingsPanel,
  RequisiteSelectModal,
  useAdminCoursesQuery,
  useRequisiteSelection,
  CATEGORY_FILTER_OPTIONS,
  type RequisiteEntry,
} from "@/features/admin-courses";
import { ADMISSION_YEARS } from "@/shared/constants";
import type { UUID } from "@/shared/model";
import { Panel } from "@/shared/ui";

/* Requisites arrive as bare UUIDs, so titles come from the catalog list — the same
   buildCourseTitleMap approach the planner and the details drawer already use. */
const titleFor = (map: Map<UUID, string>, id: UUID) => map.get(id) ?? "Курс";

const CourseEditPage = () => {
  const { courseId } = useParams<{ courseId: string }>();

  const { data: course, isLoading } = useCourseByIdQuery(courseId);

  /* Only needed to resolve requisite ids to titles; the header and the settings block
     come from the single-course request above. */
  const { data: allCourses, isLoading: titlesLoading } = useAdminCoursesQuery(
    {},
  );
  const titleMap = useMemo(
    () => buildCourseTitleMap(allCourses ?? []),
    [allCourses],
  );

  /* Год and Тип deliberately start at their first option rather than tracking the
     course — unlike the controls below, which seed from it. */
  const [year, setYear] = useState(String(ADMISSION_YEARS[0]));
  const [courseType, setCourseType] = useState<string>(
    CATEGORY_FILTER_OPTIONS[0],
  );
  const [allowedSemesters, setAllowedSemesters] = useState<string[]>([]);
  const [lecturesWeek, setLecturesWeek] = useState("0");
  const [seminarsWeek, setSeminarsWeek] = useState("0");

  /* Seed the controls once the course lands. They are local-only for now — nothing
     here is sent back. */
  useEffect(() => {
    if (!course) return;
    setAllowedSemesters(course.availableSemesters?.map(String) ?? []);
    setLecturesWeek(String(course.lecturesWeek ?? 0));
    setSeminarsWeek(String(course.seminarsWeek ?? 0));
  }, [course]);

  /* One per panel, so the two pickers keep separate search and selection. The
     picked sets are intentionally NOT linked to the cards below: a card comes from
     course.prerequisites, whose group ids are course-prerequisite groups rather
     than discipline-group ids, so the two cannot be reconciled until the save
     endpoint defines that payload. */
  const prereq = useRequisiteSelection();
  const coreq = useRequisiteSelection();

  const prerequisites = useMemo<RequisiteEntry[]>(
    () =>
      (course?.prerequisites ?? []).map((group) => ({
        key: group.groupId,
        // A group of alternatives is a "коробка": one card, any of them satisfies it.
        title: group.courses.map((id) => titleFor(titleMap, id)).join(" / "),
        courseId: group.courses.length === 1 ? group.courses[0] : undefined,
      })),
    [course, titleMap],
  );

  const corequisites = useMemo<RequisiteEntry[]>(
    () =>
      (course?.corequisites ?? []).map((id) => ({
        key: id,
        title: titleFor(titleMap, id),
        courseId: id,
      })),
    [course, titleMap],
  );

  const toggleSemester = (semester: string) =>
    setAllowedSemesters((current) =>
      current.includes(semester)
        ? current.filter((item) => item !== semester)
        : [...current, semester],
    );

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2">
      <Panel className="flex flex-col gap-4 px-2 sm:px-4 lg:px-6">
        <CourseEditHeader
          title={course?.title}
          description={course?.description}
          loading={isLoading}
        />

        <CourseSettingsPanel
          year={year}
          courseType={courseType}
          allowedSemesters={allowedSemesters}
          lecturesWeek={lecturesWeek}
          seminarsWeek={seminarsWeek}
          onYearChange={setYear}
          onCourseTypeChange={setCourseType}
          onToggleSemester={toggleSemester}
          onClearSemesters={() => setAllowedSemesters([])}
          onLecturesWeekChange={setLecturesWeek}
          onSeminarsWeekChange={setSeminarsWeek}
        />

        <CourseRequisitesPanel
          title="Пререквизиты (курсы или коробки)"
          entries={prerequisites}
          loading={isLoading || titlesLoading}
          onAdd={() => prereq.setOpen(true)}
        />

        <CourseRequisitesPanel
          title="Кореквизиты (курсы или коробки)"
          entries={corequisites}
          loading={isLoading || titlesLoading}
          onAdd={() => coreq.setOpen(true)}
        />
      </Panel>

      <RequisiteSelectModal
        open={prereq.open}
        onOpenChange={prereq.setOpen}
        excludeCourseId={courseId}
        selectedKeys={prereq.selectedKeys}
        onToggle={prereq.toggle}
      />

      <RequisiteSelectModal
        open={coreq.open}
        onOpenChange={coreq.setOpen}
        excludeCourseId={courseId}
        selectedKeys={coreq.selectedKeys}
        onToggle={coreq.toggle}
      />
    </div>
  );
};

export default CourseEditPage;
