import { UUID } from "@/shared/model";

// The two halves of the specialization editor. Both screens share one header,
// so the tab value lives here rather than inside either page.
export type SpecializationTab = "courses" | "restrictions";

export type ComparisonOperator = "eq" | "lt" | "gt";

// One "категория" pill in a rule expression. `groupId` stays a plain string
// so it can become a real category/box id once the 2.0 restrictions endpoints
// exist — nothing here assumes the placeholder options.
export interface RuleTerm {
  id: string;
  groupId: UUID;
}

// A single restriction rule: N category terms summed together, compared against a course count.
export interface RestrictionRule {
  id: string;
  title: string;
  terms: RuleTerm[];
  operator: ComparisonOperator;
  count: number;
}
