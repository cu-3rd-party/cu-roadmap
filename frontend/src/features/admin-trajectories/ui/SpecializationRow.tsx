import { GraduationCap, Trash2 } from "lucide-react";

import { Button, Chip, Panel } from "@/shared/ui";

import type { AdminSpecialization } from "../model";

interface SpecializationRowProps {
  specialization: AdminSpecialization;
  onDelete?: (specialization: AdminSpecialization) => void;
}

// Full-width row card: gray avatar circle, title, destructive action on the
// right. The row itself becomes a link once the specialization editor exists.
export const SpecializationRow = ({
  specialization,
  onDelete,
}: SpecializationRowProps) => (
  <Panel className="flex items-center gap-4 px-4 py-3 sm:px-6 sm:py-3">
    <Chip
      size="sm"
      aria-hidden
      className="size-10 shrink-0 justify-center bg-accent-pale-hover px-0"
    >
      <GraduationCap />
    </Chip>

    <span className="min-w-0 truncate text-base font-bold text-fg-primary">
      {specialization.title}
    </span>

    <Button
      variant="destructive"
      size="xs"
      className="ml-auto"
      onClick={onDelete ? () => onDelete(specialization) : undefined}
    >
      Удалить
    </Button>
  </Panel>
);
