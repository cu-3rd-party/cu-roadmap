import type { RestrictionRule } from "./types";

/* Placeholder rules for the restrictions screen. Swap for the admin
   restrictions query once the 2.0 endpoints exist — nothing else in this
   feature knows where the data came from.

   The rule starts with a single term on purpose: one category select is the
   default equation, and the wire's two-term state is what pressing "+" gives. */
export const MOCK_RESTRICTION_RULES: RestrictionRule[] = [
  {
    id: "core-fund",
    title: "Core+Fund правило",
    terms: [{ id: "core-fund-term-1", groupId: "major-core" }],
    operator: "eq",
    count: 3,
  },
];
