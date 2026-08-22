import { Panel } from "@/shared/ui";

import type { AdminSpecialization } from "../model";

import { SpecializationRow } from "./SpecializationRow";

interface SpecializationListProps {
  specializations: AdminSpecialization[];
  onDelete?: (specialization: AdminSpecialization) => void;
}

export const SpecializationList = ({
  specializations,
  onDelete,
}: SpecializationListProps) => {
  if (specializations.length === 0) {
    return (
      <Panel>
        <p className="text-sm text-fg-muted">Специализаций пока нет.</p>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {specializations.map((specialization) => (
        <SpecializationRow
          key={specialization.id}
          specialization={specialization}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
