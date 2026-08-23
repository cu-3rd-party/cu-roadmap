import {
  CourseBadges,
  CourseCardSkeleton,
  type Course,
} from "@/entities/course";
import {
  DisciplineGroupBadges,
  type DisciplineGroup,
} from "@/entities/disciplineGroup";
import type { UUID } from "@/shared/model";
import { AddCourseButton, CollapsiblePanel } from "@/shared/ui";

import type { RequisiteCardModel } from "../model";

import { RequisiteCard } from "./RequisiteCard";

interface CourseRequisitesPanelProps {
  title: string;
  cards: RequisiteCardModel[];
  coursesById: Map<UUID, Course>;
  groupsById: Map<UUID, DisciplineGroup>;
  loading?: boolean;
  onAdd?: () => void;
  onRemove: (card: RequisiteCardModel) => void;
}

const GRID_CLASS =
  "grid gap-1 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

export const CourseRequisitesPanel = ({
  title,
  cards,
  coursesById,
  groupsById,
  loading = false,
  onAdd,
  onRemove,
}: CourseRequisitesPanelProps) => (
  <CollapsiblePanel title={title}>
    <div className="flex flex-col gap-1">
      {loading ? (
        <div className={GRID_CLASS}>
          {Array.from({ length: 3 }).map((_, index) => (
            <CourseCardSkeleton key={`requisite-skeleton-${index}`} />
          ))}
        </div>
      ) : cards.length > 0 ? (
        <div className={GRID_CLASS}>
          {cards.map((card) => {
            const course =
              card.kind === "course" ? coursesById.get(card.id) : undefined;
            const group =
              card.kind === "group" ? groupsById.get(card.id) : undefined;

            return (
              <RequisiteCard
                key={card.key}
                title={
                  course?.title ??
                  group?.title ??
                  (card.kind === "group" ? "Коробка" : "Курс")
                }
                badges={
                  course ? (
                    <CourseBadges
                      variant="select"
                      category={course.category}
                      type={course.type}
                      isMobile={false}
                      className="mt-auto"
                    />
                  ) : group ? (
                    <DisciplineGroupBadges group={group} className="mt-auto" />
                  ) : undefined
                }
                onRemove={() => onRemove(card)}
              />
            );
          })}
          <AddCourseButton
            variant="card"
            label="Курс/коробка"
            onClick={onAdd}
          />
        </div>
      ) : (
        <AddCourseButton label="Курс/коробка" onClick={onAdd} />
      )}
    </div>
  </CollapsiblePanel>
);
