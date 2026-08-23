import type { DisciplineGroupDto, MathExpressionNodeDto } from "../api/dto";
import type { DisciplineGroup, DisciplineGroupNode } from "../model/types";

const LOGICAL_OPS = ["and", "or", "xor"] as const;

/* Go emits lowercase ("and"), the OpenAPI spec documents uppercase ("AND"), so
   normalize the case before matching rather than trusting either. */
const normalizeOp = (op?: string | null): DisciplineGroupNode["logicalOp"] => {
  const lowered = op?.toLowerCase();
  return LOGICAL_OPS.find((candidate) => candidate === lowered) ?? null;
};

/* Total by construction: an absent node, an empty `{}` and a null `children`
   all normalize to a well-formed node, so consumers never re-check. */
export const normalizeNode = (
  dto?: MathExpressionNodeDto | null,
): DisciplineGroupNode => ({
  type: dto?.type ?? null,
  logicalOp: normalizeOp(dto?.logical_op),
  minCount: dto?.min_count ?? 0,
  maxCount: dto?.max_count ?? null,
  courseId: dto?.course_id ?? null,
  title: dto?.title ?? "",
  children: (dto?.children ?? []).map(normalizeNode),
});

export const normalizeDisciplineGroup = (
  dto: DisciplineGroupDto,
): DisciplineGroup => ({
  id: dto.id,
  title: dto.title.trim(),
  category: dto.category,
  expression: normalizeNode(dto.math_expression),
  rootBoxId: dto.root_box_id,
});
