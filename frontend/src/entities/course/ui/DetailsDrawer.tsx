import { useMediaQuery } from "@/shared/lib";
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
  course: CourseDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DetailsDrawer = ({
  course,
  open,
  onOpenChange,
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
        <SheetHeader className="relative gap-1 overflow-hidden bg-expert-blue-pale pt-6 pb-8 pl-7">
          <SheetTitle className="text-xl font-bold text-fg-primary">
            О курсе
          </SheetTitle>
          <SheetDescription className="max-w-[60%] text-sm text-fg-primary">
            {course.title}
          </SheetDescription>
          <RevealImage
            src="/character1.png"
            alt="Персонаж 1"
            aria-hidden
            className="pointer-events-none absolute top-0 right-2 h-55 w-50 select-none object-contain"
          />
        </SheetHeader>

        {/* touch-pan-y: this is a scroll container, so the browser would
            otherwise claim horizontal flicks as panning and cancel the sheet's
            swipe-to-close drag (drag="x"). Restricting it to vertical panning
            leaves horizontal gestures for framer-motion. */}
        <div className="flex-1 space-y-6 touch-pan-y overflow-y-auto rounded-t-2xl bg-background px-6 pt-5 pb-8">
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
          <DetailField label="Специализация">
            <ul className="list-disc space-y-1 pl-5 text-fg-primary">
              {course.specialisations.length > 0 ? (
                course.specialisations.map((item) => (
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
            <RequisiteList type="pre" items={course.prerequisites} />
          </DetailField>

          <DetailField label="Постреквизиты">
            <RequisiteList type="post" items={course.postrequisites} />
          </DetailField>

          <DetailField label="Кореквизиты">
            <RequisiteList type="co" items={course.corequisites} />
          </DetailField>
        </div>
      </SheetContent>
    </Sheet>
  );
};
