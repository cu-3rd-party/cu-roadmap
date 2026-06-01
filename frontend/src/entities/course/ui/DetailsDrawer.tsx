import { Badge } from "@/shared/ui/kit/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/kit/sheet";

import { SEASON_BADGE_VARIANT, SEASON_LABELS } from "../lib";
import type { CourseDetails } from "../model/details";

import { DetailField } from "./DetailField";
import { RequisiteList } from "./RequisiteList";
import { StatusPanel } from "./StatusPanel";
import { TemplanCard } from "./TemplanCard";

interface DetailsDrawerProps {
  course: CourseDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DetailsDrawer = ({
  course,
  open,
  onOpenChange,
}: DetailsDrawerProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side="right"
      onOpenAutoFocus={(e) => e.preventDefault()}
      className="w-full gap-0 overflow-hidden bg-expert-blue-pale p-0"
    >
      <SheetHeader className="relative gap-1 overflow-hidden bg-expert-blue-pale pt-6 pb-8 pl-7">
        <SheetTitle className="text-xl font-bold text-fg-primary">
          О курсе
        </SheetTitle>
        <SheetDescription className="text-sm text-fg-primary">
          {course.title}
        </SheetDescription>
        <img
          src="/character.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute top-0 right-2 h-55 w-50 select-none object-contain"
        />
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto rounded-t-2xl bg-background px-6 pt-5 pb-8">
        {course.status && (
          <StatusPanel
            title={course.status.title}
            description={course.status.description}
          />
        )}

        <TemplanCard
          label={course.templan.label}
          value={course.templan.value}
        />

        <DetailField label="Год поступления">
          <p className="text-fg-primary">{course.admissionYears}</p>
        </DetailField>

        <DetailField label="Тип курса">
          <Badge variant="orange" size="xs">
            {course.type}
          </Badge>
        </DetailField>

        <DetailField label="Специализация">
          <ul className="list-disc space-y-1 pl-5 text-fg-primary">
            {course.specialisations.map((item) => (
              <li key={item} className="pl-1">
                {item}
              </li>
            ))}
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
          <RequisiteList items={course.prerequisites} variant="prereq" />
        </DetailField>

        <DetailField label="Постреквизиты">
          <RequisiteList items={course.postrequisites} variant="link" />
        </DetailField>

        <DetailField
          label="Кореквизиты, двухсторонняя связь"
          hint="Когда курс A нельзя брать без курса B в семестре, но курс B можно без курса A"
        >
          <RequisiteList items={course.corequisitesTwoSided} variant="link" />
        </DetailField>

        <DetailField
          label="Кореквизиты, односторонняя связь"
          hint="Когда курс A нельзя брать без курса B в семестре, но курс B можно без курса A"
        >
          <RequisiteList items={course.corequisitesOneSided} variant="link" />
        </DetailField>
      </div>
    </SheetContent>
  </Sheet>
);
