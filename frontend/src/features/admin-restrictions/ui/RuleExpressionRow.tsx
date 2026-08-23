import { CircleMinus, CirclePlus } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/shared/lib";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";

import {
  COMPARISON_OPTIONS,
  RULE_CATEGORY_OPTIONS,
  type ComparisonOperator,
  type RuleTerm,
} from "../model";

/* The pills sit on the gray track, so they invert: dark surface, light text.
   `bg-accent`/`text-accent-opposite` is the same pairing Chip's active variant
   uses. The trigger's chevron ships its own `text-muted-foreground`, so recolor
   it through a descendant selector — that out-specifies the class on the svg. */
const PILL_CLASS =
  "h-8 rounded-full border-transparent bg-accent text-accent-opposite [&_svg]:text-accent-opposite";

const OPERATOR_PILL_CLASS =
  "h-8 w-fit rounded-full border-transparent bg-expert-blue text-fg-primary-on_dark [&_svg]:text-fg-primary-on_dark";

/* Input bakes its hover/focus surfaces into arbitrary variants
   (`[&:hover:not(:focus-within)]:bg-...`) that tailwind-merge cannot dedupe
   against a plain `bg-accent`, so the dark pill has to restate them. */
const COUNT_WRAPPER_CLASS = [
  "h-8 w-14 shrink-0 justify-center rounded-full border-transparent bg-accent px-2",
  "[&:hover:not(:focus-within)]:bg-accent [&:hover:not(:focus-within)]:border-transparent",
  "focus-within:bg-accent focus-within:border-transparent",
].join(" ");

const COUNT_INPUT_CLASS =
  "text-center tabular-nums text-accent-opposite [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none";

// Module-scope counter rather than crypto.randomUUID — jsdom does not always
// provide the latter, and these ids never leave the browser.
let termSeq = 0;
const nextTermId = () => `term-${++termSeq}`;

interface RuleExpressionRowProps {
  terms: RuleTerm[];
  operator: ComparisonOperator;
  count: number;
  onTermsChange: (terms: RuleTerm[]) => void;
  onOperatorChange: (operator: ComparisonOperator) => void;
  onCountChange: (count: number) => void;
}

// The rule's "equation": one or more category terms joined by purple "+"
// badges, then a comparison operator, then a course count.
export const RuleExpressionRow = ({
  terms,
  operator,
  count,
  onTermsChange,
  onOperatorChange,
  onCountChange,
}: RuleExpressionRowProps) => {
  // Keep the raw string while typing so a half-entered value isn't clamped
  // mid-edit; commit on blur/Enter, same as the planner's load field.
  const [countDraft, setCountDraft] = useState(String(count));

  useEffect(() => setCountDraft(String(count)), [count]);

  const commitCount = () => {
    const parsed = Number(countDraft);
    const next = Number.isFinite(parsed)
      ? Math.max(0, Math.trunc(parsed))
      : count;
    setCountDraft(String(next));
    onCountChange(next);
  };

  const addTerm = () =>
    onTermsChange([
      ...terms,
      { id: nextTermId(), groupId: RULE_CATEGORY_OPTIONS[0].id },
    ]);

  // Drops the right-most term. Its "+" joiner goes with it, because joiners are
  // rendered per-term rather than as separate entries.
  const removeTerm = () => onTermsChange(terms.slice(0, -1));

  const setTermCategory = (id: string, groupId: string) =>
    onTermsChange(
      terms.map((term) => (term.id === id ? { ...term, groupId } : term)),
    );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="tertiary"
        size="xs"
        icon={<CircleMinus />}
        aria-label="Убрать категорию"
        disabled={terms.length < 2}
        onClick={removeTerm}
      />
      <Button
        variant="tertiary"
        size="xs"
        icon={<CirclePlus />}
        aria-label="Добавить категорию"
        onClick={addTerm}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-full bg-background-alt px-2 py-1.5">
        {terms.map((term, index) => (
          <div key={term.id} className="flex items-center gap-2">
            {index > 0 && (
              <span
                aria-hidden
                className="grid size-6 shrink-0 place-items-center rounded-full bg-expert-blue text-sm font-medium text-fg-primary-on_dark"
              >
                +
              </span>
            )}
            <Select
              value={term.groupId}
              onValueChange={(value) => setTermCategory(term.id, value)}
            >
              <SelectTrigger className={cn(PILL_CLASS, "w-40")}>
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent>
                {RULE_CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <Select
          value={operator}
          onValueChange={(value) =>
            onOperatorChange(value as ComparisonOperator)
          }
        >
          <SelectTrigger
            className={OPERATOR_PILL_CLASS}
            aria-label="Знак сравнения"
          >
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
            {COMPARISON_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          size="sm"
          aria-label="Количество курсов"
          value={countDraft}
          onChange={(e) => setCountDraft(e.target.value)}
          onBlur={commitCount}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitCount();
            }
          }}
          wrapperClassName={COUNT_WRAPPER_CLASS}
          className={COUNT_INPUT_CLASS}
        />
      </div>
    </div>
  );
};
