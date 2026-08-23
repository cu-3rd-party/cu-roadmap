import { Settings, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import {
  Button,
  HintButton,
  Panel,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared/ui";

import { SPECIALIZATION_TAB_LABELS, type SpecializationTab } from "../model";

interface SpecializationDetailHeaderProps {
  title: string;
  /* Optional: the backend Specialization carries only id/major_id/title. */
  description?: string;
  tab: SpecializationTab;
  onTabChange: (tab: SpecializationTab) => void;
  tabsHint: ReactNode;
  onSettings?: () => void;
  onDelete?: () => void;
  /* Right-most slot. Restrictions puts "Добавить правило" here; the courses
     screen passes nothing, which is why this is a slot and not a button prop. */
  action?: ReactNode;
}

// Shared shell for both halves of the specialization editor. Deliberately has
// no icon badge on the left — unlike the other admin page headers, the title
// itself carries the settings/delete actions.
export const SpecializationDetailHeader = ({
  title,
  description,
  tab,
  onTabChange,
  tabsHint,
  onSettings,
  onDelete,
  action,
}: SpecializationDetailHeaderProps) => (
  <Panel className="flex flex-col gap-4 px-2 sm:px-4 lg:px-6">
    <div className="flex flex-col gap-4 px-1 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-fg-primary">{title}</h1>
          <Button
            variant="tertiary"
            size="xs"
            icon={<Settings />}
            aria-label="Настройки специализации"
            onClick={onSettings}
          />
          <Button
            variant="destructive"
            size="xs"
            icon={<Trash2 />}
            aria-label="Удалить специализацию"
            onClick={onDelete}
          />
        </div>

        {description && (
          <p className="text-sm text-fg-secondary">{description}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={tab}
          onValueChange={(value) => onTabChange(value as SpecializationTab)}
        >
          <TabsList className="grid grid-flow-col auto-cols-fr">
            <TabsTrigger value="courses">
              {SPECIALIZATION_TAB_LABELS.courses}
            </TabsTrigger>
            <TabsTrigger value="restrictions">
              {SPECIALIZATION_TAB_LABELS.restrictions}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <HintButton hint={tabsHint} />

        {action}
      </div>
    </div>
  </Panel>
);
