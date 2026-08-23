import { Settings, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button, Panel } from "@/shared/ui";

import type { RestrictionRule } from "../model";

import { RuleExpressionRow } from "./RuleExpressionRow";

interface RestrictionRuleCardProps {
  rule: RestrictionRule;
  onSettings?: (rule: RestrictionRule) => void;
  onDelete?: (rule: RestrictionRule) => void;
}

// One rule: title with its own settings/delete actions, then the equation the
// rule is built from. Edits stay local until the restrictions endpoints land.
export const RestrictionRuleCard = ({
  rule,
  onSettings,
  onDelete,
}: RestrictionRuleCardProps) => {
  const [draft, setDraft] = useState(rule);

  return (
    <Panel className="flex flex-col gap-4 px-2 sm:px-4 lg:px-6">
      <div className="flex items-center gap-2 px-1">
        <h2 className="text-lg font-bold text-fg-primary">{draft.title}</h2>
        <Button
          variant="tertiary"
          size="xs"
          icon={<Settings />}
          aria-label="Настройки правила"
          onClick={onSettings ? () => onSettings(rule) : undefined}
        />
        <Button
          variant="destructive"
          size="xs"
          icon={<Trash2 />}
          aria-label="Удалить правило"
          onClick={onDelete ? () => onDelete(rule) : undefined}
        />
      </div>

      <div className="px-1">
        <RuleExpressionRow
          terms={draft.terms}
          operator={draft.operator}
          count={draft.count}
          onTermsChange={(terms) => setDraft((prev) => ({ ...prev, terms }))}
          onOperatorChange={(operator) =>
            setDraft((prev) => ({ ...prev, operator }))
          }
          onCountChange={(count) => setDraft((prev) => ({ ...prev, count }))}
        />
      </div>
    </Panel>
  );
};
