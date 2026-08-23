import type { UUID } from "@/shared/model";

/* Courses and boxes live in different tables, so a bare uuid would be ambiguous.
   UUIDs contain no colon, so the prefix parses back unambiguously. */
export type RequisiteKind = "course" | "group";
export type RequisiteKey = `${RequisiteKind}:${UUID}`;

export const requisiteKey = (kind: RequisiteKind, id: UUID): RequisiteKey =>
  `${kind}:${id}`;

export const courseKey = (id: UUID): RequisiteKey => requisiteKey("course", id);
export const groupKey = (id: UUID): RequisiteKey => requisiteKey("group", id);

export const parseRequisiteKey = (
  key: RequisiteKey,
): { kind: RequisiteKind; id: UUID } => {
  const separator = key.indexOf(":");
  return {
    kind: key.slice(0, separator) as RequisiteKind,
    id: key.slice(separator + 1),
  };
};
