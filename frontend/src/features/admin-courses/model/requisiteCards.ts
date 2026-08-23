import type { CourseDependency, DependencyType } from "@/entities/course";
import type { UUID } from "@/shared/model";

/* One card in a requisites panel. A box card can stand for several dependency
   rows: a "выбор 1 из N" alternative group is stored as one row per course, all
   sharing the same required_group_id, and it reads as a single box. */
export interface RequisiteCardModel {
  key: string;
  kind: "course" | "group";
  /* The course or discipline-group this card stands for. */
  id: UUID;
  /* Rows this card owns — removing the card removes all of them. */
  rowIds: UUID[];
}

/* Group rows into cards, preserving order of first appearance. Rows carrying a
   group id collapse into one card per group; a row with only a course id is its
   own card. Rows with neither (the backend permits it) are dropped. */
export const buildRequisiteCards = (
  dependencies: CourseDependency[],
  type: DependencyType,
): RequisiteCardModel[] => {
  const cards: RequisiteCardModel[] = [];
  const indexByKey = new Map<string, number>();

  for (const row of dependencies) {
    if (row.type !== type) continue;

    const kind = row.requiredGroupId ? "group" : "course";
    const id = row.requiredGroupId ?? row.requiredCourseId;
    if (!id) continue;

    const key = `${kind}:${id}`;
    const existing = indexByKey.get(key);
    if (existing !== undefined) {
      cards[existing].rowIds.push(row.id);
      continue;
    }

    indexByKey.set(key, cards.length);
    cards.push({ key, kind, id, rowIds: [row.id] });
  }

  return cards;
};

export const removeRequisiteCard = (
  dependencies: CourseDependency[],
  card: RequisiteCardModel,
): CourseDependency[] => {
  const dropped = new Set(card.rowIds);
  return dependencies.filter((row) => !dropped.has(row.id));
};

/* Locally added rows have no server id yet; a client-side one keeps React keys
   and removal working until a save assigns the real one. */
let localRowSeq = 0;
const nextLocalRowId = (): UUID => `local-${++localRowSeq}`;

export const addRequisite = (
  dependencies: CourseDependency[],
  courseId: UUID,
  type: DependencyType,
  target: { kind: "course" | "group"; id: UUID },
): CourseDependency[] => {
  const alreadyThere = dependencies.some(
    (row) =>
      row.type === type &&
      (target.kind === "group"
        ? row.requiredGroupId === target.id
        : row.requiredGroupId === null && row.requiredCourseId === target.id),
  );
  if (alreadyThere) return dependencies;

  return [
    ...dependencies,
    {
      id: nextLocalRowId(),
      courseId,
      requiredCourseId: target.kind === "course" ? target.id : null,
      requiredGroupId: target.kind === "group" ? target.id : null,
      type,
      alternativeGroup: 0,
    },
  ];
};
