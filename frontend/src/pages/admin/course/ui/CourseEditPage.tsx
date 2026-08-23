import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  useCourseByIdQuery,
  useCourseDependenciesQuery,
  type CourseDependency,
  type DependencyType,
} from "@/entities/course";
import { useDisciplineGroupsQuery } from "@/entities/disciplineGroup";
import {
  addRequisite,
  buildRequisiteCards,
  CATEGORY_FILTER_OPTIONS,
  courseToEditorFields,
  CourseEditHeader,
  CourseRequisitesPanel,
  CourseSettingsPanel,
  editorSnapshotKey,
  parseRequisiteKey,
  removeRequisiteCard,
  RequisiteSelectModal,
  requisiteKey,
  useAdminCoursesQuery,
  type RequisiteCardModel,
  type RequisiteKey,
} from "@/features/admin-courses";
import { ADMISSION_YEARS } from "@/shared/constants";
import { Panel } from "@/shared/ui";

const CourseEditPage = () => {
  const { courseId } = useParams<{ courseId: string }>();

  const { data: course, isLoading } = useCourseByIdQuery(courseId);
  const { data: serverDependencies, isLoading: dependenciesLoading } =
    useCourseDependenciesQuery(courseId);

  /* Both lists put a title and badges on a requisite card. The picker runs the
     same queries, so react-query serves them once. */
  const { data: allCourses } = useAdminCoursesQuery({});
  const { data: allGroups } = useDisciplineGroupsQuery();

  const coursesById = useMemo(
    () => new Map((allCourses ?? []).map((item) => [item.id, item])),
    [allCourses],
  );
  const groupsById = useMemo(
    () => new Map((allGroups ?? []).map((item) => [item.id, item])),
    [allGroups],
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(String(ADMISSION_YEARS[0]));
  const [courseType, setCourseType] = useState<string>(
    CATEGORY_FILTER_OPTIONS[0],
  );
  const [allowedSemesters, setAllowedSemesters] = useState<string[]>([]);
  const [lecturesWeek, setLecturesWeek] = useState("0");
  const [seminarsWeek, setSeminarsWeek] = useState("0");
  const [dependencies, setDependencies] = useState<CourseDependency[]>([]);

  const [prereqOpen, setPrereqOpen] = useState(false);
  const [coreqOpen, setCoreqOpen] = useState(false);

  useEffect(() => {
    if (!course) return;
    const fields = courseToEditorFields(course);
    setTitle(fields.title);
    setDescription(fields.description);
    setYear(fields.year);
    setCourseType(fields.courseType);
    setAllowedSemesters(fields.semesters);
    setLecturesWeek(fields.lecturesWeek);
    setSeminarsWeek(fields.seminarsWeek);
  }, [course]);

  useEffect(() => {
    if (serverDependencies) setDependencies(serverDependencies);
  }, [serverDependencies]);

  const currentKey = editorSnapshotKey(
    {
      title,
      description,
      year,
      courseType,
      semesters: allowedSemesters,
      lecturesWeek,
      seminarsWeek,
    },
    dependencies,
  );

  /* Derived from the fetched data rather than captured from state on load: the
     seeding effects above run in the same commit that would capture a baseline,
     so a captured one would snapshot the pre-seed values and read as dirty
     immediately. */
  const loadedKey = useMemo(
    () =>
      course && serverDependencies
        ? editorSnapshotKey(courseToEditorFields(course), serverDependencies)
        : null,
    [course, serverDependencies],
  );

  const dirty = loadedKey !== null && currentKey !== loadedKey;

  const prerequisiteCards = useMemo(
    () => buildRequisiteCards(dependencies, "prerequisite"),
    [dependencies],
  );
  const corequisiteCards = useMemo(
    () => buildRequisiteCards(dependencies, "corequisite"),
    [dependencies],
  );

  const selectedKeys = (cards: RequisiteCardModel[]) =>
    new Set(cards.map((card) => requisiteKey(card.kind, card.id)));

  /* Selection in the picker IS the panel's contents: picking adds a card,
     unpicking removes it, so the two can never disagree. */
  const toggleRequisite = (
    type: DependencyType,
    cards: RequisiteCardModel[],
    key: RequisiteKey,
  ) => {
    const { kind, id } = parseRequisiteKey(key);
    const existing = cards.find((card) => card.kind === kind && card.id === id);

    setDependencies((rows) =>
      existing
        ? removeRequisiteCard(rows, existing)
        : addRequisite(rows, courseId!, type, { kind, id }),
    );
  };

  const removeCard = (card: RequisiteCardModel) =>
    setDependencies((rows) => removeRequisiteCard(rows, card));

  const toggleSemester = (semester: string) =>
    setAllowedSemesters((selected) =>
      selected.includes(semester)
        ? selected.filter((item) => item !== semester)
        : [...selected, semester],
    );

  const requisitesLoading = isLoading || dependenciesLoading;

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2">
      <Panel className="flex flex-col gap-4 px-2 sm:px-4 lg:px-6">
        <CourseEditHeader
          title={title}
          description={description}
          loading={isLoading}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          dirty={dirty}
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
          cards={prerequisiteCards}
          coursesById={coursesById}
          groupsById={groupsById}
          loading={requisitesLoading}
          onAdd={() => setPrereqOpen(true)}
          onRemove={removeCard}
        />

        <CourseRequisitesPanel
          title="Кореквизиты (курсы или коробки)"
          cards={corequisiteCards}
          coursesById={coursesById}
          groupsById={groupsById}
          loading={requisitesLoading}
          onAdd={() => setCoreqOpen(true)}
          onRemove={removeCard}
        />
      </Panel>

      <RequisiteSelectModal
        open={prereqOpen}
        onOpenChange={setPrereqOpen}
        excludeCourseId={courseId}
        selectedKeys={selectedKeys(prerequisiteCards)}
        onToggle={(key) =>
          toggleRequisite("prerequisite", prerequisiteCards, key)
        }
      />

      <RequisiteSelectModal
        open={coreqOpen}
        onOpenChange={setCoreqOpen}
        excludeCourseId={courseId}
        selectedKeys={selectedKeys(corequisiteCards)}
        onToggle={(key) =>
          toggleRequisite("corequisite", corequisiteCards, key)
        }
      />
    </div>
  );
};

export default CourseEditPage;
