import { motion } from "framer-motion";
import { useMemo, useState } from "react";

import { useCoursesQuery } from "@/entities/course";
import { useMajorsQuery } from "@/entities/major";
import {
  buildGenerateRoadmapRequest,
  buildGoalPathRequest,
  useGenerateRoadmapMutation,
  useGoalPathMutation,
  usePlannerStore,
} from "@/entities/roadmap";
import type { Roadmap } from "@/entities/roadmap";
import { CourseSource } from "@/entities/roadmap/api";
import { useSettingsStore } from "@/features/settings";
import { getErrorMessage } from "@/shared/api";
import { admissionYearToSemester, SEMESTER_NUMBERS } from "@/shared/constants";
import type { SemesterNumber } from "@/shared/constants";
import { cn } from "@/shared/lib";
import {
  Button,
  Command,
  CommandCheck,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  RevealImage,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui";

import { getInsertedText } from "../lib";

interface TrajectorySelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TrajectorySelectModal = ({
  open,
  onOpenChange,
}: TrajectorySelectModalProps) => {
  const { admissionYear } = useSettingsStore();
  const { data: courses } = useCoursesQuery(admissionYear);
  const { data: majors } = useMajorsQuery(admissionYear);
  const { addCourse, markGenerated } = usePlannerStore();
  const { mutateAsync: generateRoadmap, isPending } =
    useGenerateRoadmapMutation();
  const { mutateAsync: generateGoalPath, isPending: goalPending } =
    useGoalPathMutation();

  const [courseQuery, setCourseQuery] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courseOpen, setCourseOpen] = useState(false);
  const [courseCommitted, setCourseCommitted] = useState(true);
  const [semester, setSemester] = useState("any");
  const [tab, setTab] = useState("major");
  const [majorId, setMajorId] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Which of the already-saved courses count as "passed" for the generate
  const [scope, setScope] = useState<CourseSource>("passed");

  const canSubmit =
    tab === "major" ? majorId !== "" : courseId !== "" && semester !== "";

  // Course tab: only target semesters at or after the cohort's current semester.
  const minSemester =
    admissionYear != null ? admissionYearToSemester[admissionYear] : 1;

  const savedCourseTitle =
    courses?.find((course) => course.id === courseId)?.title ?? "";

  const courseHints = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    if (!q || !courses) return [];
    return courses
      .filter((course) => course.title.toLowerCase().includes(q))
      .slice(0, 5);
  }, [courseQuery, courses]);

  // Semesters offered for the chosen course, kept at/after the cohort's current
  // semester. No course picked -> no options (only "Любой" is shown).
  const semesterOptions = useMemo(() => {
    const selected = courses?.find((course) => course.id === courseId);
    if (!selected) return [];
    return SEMESTER_NUMBERS.filter(
      (s) => s >= minSemester && selected.availableSemesters.includes(s),
    );
  }, [courses, courseId, minSemester]);

  // The course field always shows a committed option (or nothing). Typing over a
  // committed value wipes it so the user can search again; blurring without
  // picking anything restores the last saved option.
  const handleCourseChange = (value: string) => {
    setError(null);
    if (courseCommitted) {
      setCourseCommitted(false);
      setCourseQuery(getInsertedText(savedCourseTitle, value));
    } else {
      setCourseQuery(value);
    }
    setCourseOpen(true);
  };

  const handleCourseBlur = () => {
    setCourseQuery(savedCourseTitle);
    setCourseCommitted(true);
    setCourseOpen(false);
  };

  const selectCourse = (id: string, title: string) => {
    setError(null);
    setCourseId(id);
    setCourseQuery(title);
    setCourseCommitted(true);
    setCourseOpen(false);
    // Switching the course invalidates the previously picked semester.
    setSemester("any");
  };

  const close = () => onOpenChange(false);

  // Merge a generated/goal-path roadmap into the plan (addCourse dedups per
  // semester) and mark the added courses for the blue highlight.
  const applyRoadmap = (result: Roadmap) => {
    const byId = new Map((courses ?? []).map((course) => [course.id, course]));
    for (const { semester: sem, courseIds } of result.semesters) {
      for (const id of courseIds) {
        const course = byId.get(id);
        addCourse(
          sem,
          course
            ? {
                id: course.id,
                title: course.title,
                category: course.category,
                type: course.type,
              }
            : { id, title: id },
        );
      }
    }
    markGenerated(result.semesters.flatMap((s) => s.courseIds));
  };

  const handleSubmit = async () => {
    if (admissionYear == null) {
      close();
      return;
    }
    const selections = usePlannerStore.getState().selections;
    setError(null);

    try {
      if (tab === "major") {
        if (!majorId) {
          close();
          return;
        }
        const result = await generateRoadmap(
          buildGenerateRoadmapRequest(
            selections,
            admissionYear,
            majorId,
            scope,
          ),
        );
        // Soft error from the backend: surface it and keep the modal open.
        if (result.error) {
          setError(result.error);
          return;
        }
        applyRoadmap(result);
      } else {
        if (!courseId || semester === "") {
          close();
          return;
        }
        const goalSemester =
          semester === "any" ? undefined : (Number(semester) as SemesterNumber);
        const result = await generateGoalPath(
          buildGoalPathRequest(
            selections,
            admissionYear,
            courseId,
            goalSemester,
          ),
        );
        if (result.error) {
          setError(result.error);
          return;
        }
        applyRoadmap(result);
      }
    } catch (e) {
      // Keep the modal open and show why (backend error body / status / network).
      setError(getErrorMessage(e));
      return;
    }

    close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className={cn(
          "flex w-[calc(100%-2rem)] sm:max-w-4xl flex-col gap-0 overflow-hidden rounded-3xl bg-expert-blue-pale p-0",
          error ? "h-140" : "h-130",
        )}
      >
        <DialogHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
          <DialogTitle className="text-2xl font-bold text-fg-primary">
            Подбор траектории
          </DialogTitle>
          <RevealImage
            src="/character1.png"
            alt="Персонаж"
            aria-hidden
            className="pointer-events-none absolute top-1 right-8 h-28 w-auto select-none object-contain"
          />
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-full flex-col gap-4 rounded-2xl bg-background p-5">
            <Tabs
              value={tab}
              onValueChange={(value) => {
                setError(null);
                setTab(value);
              }}
              className="gap-4"
            >
              <div className="text-sm text-fg-secondary">
                <p>Выберите тип построения траектории:</p>
                <ol className="mt-1 flex list-decimal flex-col gap-1 pl-5">
                  <li>
                    <span className="font-medium text-fg-primary">Мейджор</span>{" "}
                    - собрать траекторию для выбранного вами мейджора
                  </li>
                  <li>
                    <span className="font-medium text-fg-primary">Курс</span> -
                    добавить все пререквизиты и кореквизиты в траекторию так,
                    чтобы пройти курс в выбранном семестре
                  </li>
                </ol>
              </div>

              <TabsList className="grid grid-flow-col auto-cols-fr self-center">
                <TabsTrigger value="major">Мейджор</TabsTrigger>
                <TabsTrigger value="course">Курс</TabsTrigger>
              </TabsList>

              <TabsContent
                value="major"
                className="flex flex-col gap-3 self-center"
              >
                <p className="text-sm text-fg-secondary self-center">
                  Выберите мейджор
                </p>
                <Tabs
                  value={majorId}
                  onValueChange={(value) => {
                    setError(null);
                    setMajorId(value);
                  }}
                  className="gap-4"
                >
                  <TabsList className="grid grid-flow-col auto-cols-fr">
                    {majors?.map((major) => (
                      <TabsTrigger key={major.id} value={major.id}>
                        {major.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                <p className="text-sm text-fg-secondary self-center">
                  Какие курсы учитывать в построении траектории
                </p>
                <Tabs
                  value={scope}
                  onValueChange={(value) => {
                    setError(null);
                    setScope(value as CourseSource);
                  }}
                  className="gap-4"
                >
                  <TabsList className="grid grid-flow-col auto-cols-fr self-center">
                    <TabsTrigger value="passed">Только пройденные</TabsTrigger>
                    <TabsTrigger value="selected">Все добавленные</TabsTrigger>
                  </TabsList>
                </Tabs>
              </TabsContent>

              <TabsContent value="course" className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm text-fg-secondary self-center">
                    Найдите свой курс
                  </p>
                  <Command
                    shouldFilter={false}
                    className="relative overflow-visible bg-transparent"
                  >
                    <CommandInput
                      value={courseQuery}
                      onValueChange={handleCourseChange}
                      onBlur={handleCourseBlur}
                      placeholder="Поиск по названию или описанию"
                      wrapperClassName="h-12 rounded-[12px] border border-border bg-background px-[14px] [&:hover:not(:focus-within)]:border-border-hover [&:hover:not(:focus-within)]:bg-accent-pale-hover focus-within:border-border-pressed focus-within:bg-accent-pale-hover"
                    />
                    {courseOpen && courseQuery.trim() && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                          type: "tween",
                          duration: 0.28,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{ transformOrigin: "top left" }}
                        onMouseDown={(event) => event.preventDefault()}
                        className="absolute top-full right-0 left-0 z-20 mt-1 rounded-xl border border-border bg-background shadow-md"
                      >
                        {courseHints.length > 0 ? (
                          <CommandList>
                            <CommandGroup>
                              {courseHints.map((course) => (
                                <CommandItem
                                  key={course.id}
                                  value={`${course.title} ${course.id}`}
                                  onSelect={() =>
                                    selectCourse(course.id, course.title)
                                  }
                                >
                                  <span className="truncate">
                                    {course.title}
                                  </span>
                                  <CommandCheck
                                    checked={courseId === course.id}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        ) : (
                          <div className="px-3 py-6 text-center text-sm text-fg-tertiary">
                            Ничего не найдено
                          </div>
                        )}
                      </motion.div>
                    )}
                  </Command>
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-sm text-fg-secondary self-center">
                    Выберите семестр, в котором хотели бы пройти курс
                  </p>
                  <Select
                    value={semester}
                    onValueChange={(value) => {
                      setError(null);
                      setSemester(value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Любой</SelectItem>
                      {semesterOptions.map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {s} семестр
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-auto flex flex-col gap-4">
              <p className="text-sm text-fg-secondary">
                Добавленные автоматически курсы{" "}
                <span className="inline-block rounded-md border-2 border-expert-blue px-1.5 py-0.5 font-medium text-fg-primary">
                  будут обведены так
                </span>
              </p>

              {error && (
                <p className="text-sm text-fg-negative">Ошибка: {error}</p>
              )}

              <div className="flex items-center justify-between">
                <Button variant="tertiaryPadded" size="md" onClick={close}>
                  Отмена
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  loading={isPending || goalPending}
                >
                  Обновить траекторию
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
