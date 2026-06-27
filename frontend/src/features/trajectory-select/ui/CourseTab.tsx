import { motion } from "framer-motion";

import type { Course } from "@/entities/course";
import type { SemesterNumber } from "@/shared/constants";
import {
  Command,
  CommandCheck,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TabsContent,
} from "@/shared/ui";

interface CourseTabProps {
  courseQuery: string;
  courseOpen: boolean;
  courseHints: Course[];
  courseId: string;
  onCourseChange: (value: string) => void;
  onCourseBlur: () => void;
  onSelectCourse: (id: string, title: string) => void;
  semester: string;
  semesterOptions: SemesterNumber[];
  onSemesterChange: (value: string) => void;
}

export const CourseTab = ({
  courseQuery,
  courseOpen,
  courseHints,
  courseId,
  onCourseChange,
  onCourseBlur,
  onSelectCourse,
  semester,
  semesterOptions,
  onSemesterChange,
}: CourseTabProps) => (
  <TabsContent value="course" className="flex flex-col gap-4">
    <div className="flex flex-col gap-1.5">
      <p className="text-xs sm:text-sm text-fg-secondary self-center">Курс</p>
      <Command
        shouldFilter={false}
        className="relative overflow-visible bg-transparent"
      >
        <CommandInput
          value={courseQuery}
          onValueChange={onCourseChange}
          onBlur={onCourseBlur}
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
                      onSelect={() => onSelectCourse(course.id, course.title)}
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
      <p className="text-xs sm:text-sm text-fg-secondary self-center">
        Семестр, в котором курс хотелось бы пройти
      </p>
      <Select value={semester} onValueChange={onSemesterChange}>
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
);
