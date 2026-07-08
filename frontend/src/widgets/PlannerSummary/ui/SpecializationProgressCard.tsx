import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronUp, X } from "lucide-react";
import { useState } from "react";

import { useCourseDrawerStore } from "@/entities/course";
import { cn } from "@/shared/lib/cn";
import type { UUID } from "@/shared/model";
import { AnimatedNumber } from "@/shared/ui/animated-number";
import { SegmentedProgress } from "@/shared/ui/segmented-progress";

export type LinkedCourseStatus = "available" | "completed" | "unavailable";

export interface LinkedCourse {
  id: UUID;
  title: string;
  status: LinkedCourseStatus;
  isMandatory?: boolean;
}

export interface SpecializationProgress {
  title: string;
  earnedPct: number;
  availablePct: number;
  linkedCourses: LinkedCourse[];
}

interface LegendRowProps {
  dotClassName: string;
  label: string;
  percent: number;
}

const LegendRow = ({ dotClassName, label, percent }: LegendRowProps) => (
  <div className="flex items-center gap-2 text-sm text-fg-secondary">
    <span className={cn("size-1.5 shrink-0 rounded-full", dotClassName)} />
    <span className="text-xs sm:text-sm">{label}</span>
    <span className="ml-auto text-fg-primary text-sm">
      <AnimatedNumber value={percent} />%
    </span>
  </div>
);

const LinkedCourseRow = (course: LinkedCourse) => {
  const { openCourse } = useCourseDrawerStore();

  return (
    <li className="flex items-start gap-2 text-xs sm:text-sm text-fg-secondary">
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
        {course.status === "completed" ? (
          <Check className="size-4 text-positive" />
        ) : course.status === "unavailable" ? (
          <X className="size-4 text-negative" />
        ) : course.isMandatory ? (
          <span
            className="text-sm leading-none font-bold text-fg-expert-orange"
            title="Обязательный курс"
            aria-label="Обязательный курс"
          >
            !
          </span>
        ) : (
          <span className="size-1 rounded-full bg-fg-muted" />
        )}
      </span>
      <button
        type="button"
        onClick={() => openCourse(course.id)}
        className={cn(
          "text-left hover:underline cursor-pointer",
          course.status === "unavailable" && "line-through text-fg-muted",
        )}
      >
        {course.title}
      </button>
    </li>
  );
};

const LinkedCoursesSection = ({ courses }: { courses: LinkedCourse[] }) => {
  const [open, setOpen] = useState(false);

  return (
    <div data-state={open ? "open" : "closed"}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={
          open ? "Свернуть связанные курсы" : "Развернуть связанные курсы"
        }
        className="group flex w-full items-center justify-between gap-2 cursor-pointer"
      >
        <span className="text-xs sm:text-sm font-semibold text-fg-secondary transition-colors group-hover:text-fg-primary">
          Связанные курсы
        </span>
        <ChevronUp
          className={cn(
            "size-5 shrink-0 transition-transform text-fg-secondary group-hover:text-fg-primary",
            !open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden mt-2"
          >
            <ul className="flex flex-col gap-1">
              {courses.map((course) => (
                <LinkedCourseRow key={course.id} {...course} />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SpecializationProgressCard = ({
  title,
  earnedPct,
  availablePct,
  linkedCourses,
}: SpecializationProgress) => {
  return (
    <div className="flex flex-col gap-3 p-3 sm:p-5 sm:py-3">
      <span className="flex min-h-[2lh] items-center justify-center text-center text-sm font-semibold text-fg-secondary">
        {title}
      </span>

      <SegmentedProgress
        animated
        segments={[
          { key: "earned", value: earnedPct, className: "bg-positive" },
          {
            key: "available",
            value: availablePct,
            className: "bg-categorical-23",
          },
          {
            key: "remainder",
            value: Math.max(0, 100 - earnedPct - availablePct),
            className: "bg-background-alt",
          },
        ]}
      />

      <div className="flex flex-col gap-1">
        <LegendRow
          dotClassName="bg-positive"
          label="Набрано"
          percent={earnedPct}
        />
        <LegendRow
          dotClassName="bg-categorical-23"
          label="Можно набрать"
          percent={availablePct}
        />
      </div>

      {linkedCourses.length > 0 && (
        <LinkedCoursesSection courses={linkedCourses} />
      )}
    </div>
  );
};
