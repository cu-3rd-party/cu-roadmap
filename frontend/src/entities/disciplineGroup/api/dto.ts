import type { UUID } from "@/shared/model";

/* Every field is optional on purpose: the backend defaults math_expression to an
   empty object `{}` on create/update, so a node can legitimately arrive with no
   type, no children and no operator. Making that explicit here forces the
   normalizer to handle it instead of pushing checks onto every call site. */
export interface MathExpressionNodeDto {
  type?: "course" | "logical" | "optional";
  logical_op?: string | null;
  min_count?: number;
  max_count?: number | null;
  course_id?: UUID | null;
  title?: string;
  children?: MathExpressionNodeDto[] | null;
}

// Raw discipline group ("коробка") as returned by GET /api/v1/discipline-groups
export interface DisciplineGroupDto {
  id: UUID;
  title: string;
  category: string;
  math_expression: MathExpressionNodeDto | null;
  root_box_id: UUID;
}

/* Body for POST/PUT. `math_expression` is `binding:"required"` on the Go side,
   so an omitted field is a 400 — an empty tree must be sent as an explicit `{}`.
   `category` is a free-form varchar; values in the wild are "prerequisite",
   "corequisite" and "analog_group". */
export interface DisciplineGroupRequestDto {
  title: string;
  category?: string;
  math_expression: MathExpressionNodeDto | Record<string, never>;
}
