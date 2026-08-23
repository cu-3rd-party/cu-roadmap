import type { DisciplineGroupNode } from "../model/types";

/* The rule a group applies to its children. "and" means every child is
   required; anything else is a choice, shown as "N из M".

   Returns null when the group has no children — the backend allows an empty
   `math_expression`, and "0 из 0" would be noise rather than information. */
export const groupRuleLabel = (node: DisciplineGroupNode): string | null => {
  if (node.children.length === 0) return null;
  if (node.logicalOp === "and") return "Логика";
  return `${node.minCount} из ${node.children.length}`;
};
