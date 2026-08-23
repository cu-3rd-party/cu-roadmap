import type { StructureSpecialization } from "@/entities/major";
import { getErrorMessage } from "@/shared/api";
import { Panel, Skeleton } from "@/shared/ui";

import { SpecializationRow } from "./SpecializationRow";

const SKELETON_COUNT = 3;

interface SpecializationListProps {
  specializations?: StructureSpecialization[];
  isLoading?: boolean;
  error?: unknown;
  onDelete?: (specialization: StructureSpecialization) => void;
}

export const SpecializationList = ({
  specializations,
  isLoading = false,
  error,
  onDelete,
}: SpecializationListProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <Panel
            key={index}
            className="flex items-center gap-4 px-4 py-3 sm:px-6"
          >
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <Skeleton className="h-5 w-64 max-w-full" />
          </Panel>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Panel>
        <p className="text-sm text-negative">{getErrorMessage(error)}</p>
      </Panel>
    );
  }

  if (!specializations?.length) {
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
