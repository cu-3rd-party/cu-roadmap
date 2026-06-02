import { motion } from "framer-motion";
import { useMemo, useState } from "react";

import { AVAILABLE_COURSES } from "@/features/course-select/model/courses";
import { SEMESTER_NUMBERS } from "@/shared/constants";
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
  const [courseQuery, setCourseQuery] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courseOpen, setCourseOpen] = useState(false);
  const [courseCommitted, setCourseCommitted] = useState(true);
  const [semester, setSemester] = useState("");

  const savedCourseTitle =
    AVAILABLE_COURSES.find((course) => course.id === courseId)?.title ?? "";

  const courseHints = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    if (!q) return [];
    return AVAILABLE_COURSES.filter((course) =>
      course.title.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [courseQuery]);

  // The course field always shows a committed option (or nothing). Typing over a
  // committed value wipes it so the user can search again; blurring without
  // picking anything restores the last saved option.
  const handleCourseChange = (value: string) => {
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
    setCourseId(id);
    setCourseQuery(title);
    setCourseCommitted(true);
    setCourseOpen(false);
  };

  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex h-130 w-[calc(100%-2rem)] sm:max-w-4xl flex-col gap-0 overflow-hidden rounded-3xl bg-expert-blue-pale p-0"
      >
        <DialogHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
          <DialogTitle className="text-2xl font-bold text-fg-primary">
            Подбор траектории
          </DialogTitle>
          <img
            src="/character1.png"
            alt="Персонаж"
            aria-hidden
            className="pointer-events-none absolute top-1 right-8 h-28 w-auto select-none object-contain"
          />
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-full flex-col gap-4 rounded-2xl bg-background p-5">
            <Tabs defaultValue="major" className="gap-4">
              <div className="text-sm text-fg-secondary">
                <p>Выберите тип построения траектории:</p>
                <ol className="mt-1 flex list-decimal flex-col gap-1 pl-5">
                  <li>
                    <span className="font-medium text-fg-primary">Мейджор</span> - собрать траекторию для выбранного вами мейджора
                  </li>
                  <li>
                    <span className="font-medium text-fg-primary">Курс</span> - добавить все пререквизиты и кореквизиты в траекторию так, чтобы пройти курс в выбранном семестре
                  </li>
                </ol>
              </div>
              
              <TabsList className="self-center">
                <TabsTrigger value="major">Мейджор</TabsTrigger>
                <TabsTrigger value="course">Курс</TabsTrigger>
              </TabsList>

              <TabsContent value="major" className="flex flex-col gap-3 self-center">
                <p className="text-sm text-fg-secondary self-center">Выберите мейджор</p>
                <Tabs defaultValue="business" className="gap-4">
                  <TabsList>
                    <TabsTrigger value="business">Business</TabsTrigger>
                    <TabsTrigger value="se">Software Engineering</TabsTrigger>
                    <TabsTrigger value="ai">AI</TabsTrigger>
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
                                  <span className="truncate">{course.title}</span>
                                  <CommandCheck checked={courseId === course.id} />
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
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEMESTER_NUMBERS.map((s) => (
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

              <div className="flex items-center justify-between">
                <Button variant="tertiaryPadded" size="md" onClick={close}>
                  Отмена
                </Button>
                <Button variant="outline" size="md" onClick={close}>
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
