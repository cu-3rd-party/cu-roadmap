import { Loader2 } from "lucide-react";

import { useMediaQuery } from "@/shared/lib";
import type { UUID } from "@/shared/model";
import {
  Badge,
  RevealImage,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui";

import { SEASON_BADGE_VARIANT, SEASON_LABELS } from "../lib";
import type { CourseDetails } from "../model";

import { DetailField } from "./DetailField";
import { RequisiteList } from "./RequisiteList";
import { SyllabusCard } from "./SyllabusCard";

interface DetailsDrawerProps {
  course: CourseDetails | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Navigate to a linked requisite course (in-place content swap).
  onNavigate: (id: UUID) => void;
  navigableIds: Set<UUID>;
}

export const DetailsDrawer = ({
  course,
  open,
  onOpenChange,
  onNavigate,
  navigableIds,
}: DetailsDrawerProps) => {
  const isMobile = useMediaQuery("sm");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        swipeToClose={isMobile}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-full max-w-none gap-0 overflow-hidden bg-expert-blue-pale p-0 sm:max-w-xl"
      >
        <SheetHeader className="relative gap-1 overflow-hidden bg-expert-blue-pale pt-6 pb-4 pl-7">
          <SheetTitle className="text-xl font-bold text-fg-primary">
            О курсе
          </SheetTitle>
          <SheetDescription className="max-w-[60%] line-clamp-2 min-h-[2lh] text-sm text-fg-primary">
            {course?.title ?? ""}
          </SheetDescription>
          <RevealImage
            src="/character1.png"
            alt="Персонаж 1"
            aria-hidden
            className="pointer-events-none absolute top-0 right-2 h-55 w-50 select-none object-contain"
          />
        </SheetHeader>

        {!course ? (
          <div className="flex flex-1 items-center justify-center bg-background">
            <Loader2
              className="size-8 animate-spin text-fg-secondary"
              aria-hidden
            />
          </div>
        ) : (
          // key resets scroll to top when navigating between courses.
          // touch-pan-y for framer-motion.
          <div
            key={course.title}
            className="flex-1 space-y-6 touch-pan-y overflow-y-auto rounded-t-2xl bg-background px-6 pt-5 pb-8"
          >
            <SyllabusCard link={course.syllabus} />

            {course.description && (
              <DetailField label="Описание">
                <p className="text-fg-primary">{course.description}</p>
              </DetailField>
            )}

            <DetailField label="Год поступления">
              <p className="text-fg-primary">{course.admissionYears}</p>
            </DetailField>

            <DetailField label="Тип курса">
              <Badge variant="orange" size="xs">
                {course.category}
              </Badge>
            </DetailField>
            <DetailField label="Специализации">
              <ul className="list-disc space-y-1 pl-5 text-fg-primary">
                {course.specializations.length > 0 ? (
                  course.specializations.map((item) => (
                    <li key={item} className="pl-1">
                      {item}
                    </li>
                  ))
                ) : (
                  <li>Общеуниверситетская дисциплина</li>
                )}
              </ul>
            </DetailField>

            <DetailField label="Осень / весна">
              {course.seasons.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {course.seasons.map((season) => (
                    <Badge
                      key={season}
                      variant={SEASON_BADGE_VARIANT[season]}
                      size="xs"
                    >
                      {SEASON_LABELS[season]}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-fg-primary">—</p>
              )}
            </DetailField>

            <DetailField label="Рекомендованный к прохождению семестр">
              <Badge variant="blue" size="xs">
                {course.recommendedSemester}
              </Badge>
            </DetailField>

            <DetailField label="Пререквизиты">
              <RequisiteList
                type="pre"
                groups={course.prerequisites}
                onNavigate={onNavigate}
                navigableIds={navigableIds}
              />
            </DetailField>

            <DetailField label="Постреквизиты">
              <RequisiteList
                type="post"
                items={course.postrequisites}
                onNavigate={onNavigate}
                navigableIds={navigableIds}
              />
            </DetailField>

            <DetailField label="Кореквизиты">
              <RequisiteList
                type="co"
                items={course.corequisites}
                onNavigate={onNavigate}
                navigableIds={navigableIds}
              />
            </DetailField>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
