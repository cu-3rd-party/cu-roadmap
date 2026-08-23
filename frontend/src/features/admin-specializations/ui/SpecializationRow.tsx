import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

import type { StructureSpecialization } from "@/entities/major";
import { Button, Chip, Panel } from "@/shared/ui";

interface SpecializationRowProps {
  specialization: StructureSpecialization;
  /* ATTENTION Optional because there is no delete-specialization endpoint yet — the
     backend only exposes DeleteSpecializations(majorID), which wipes every
     specialization of a major. The button stays out until a single-id route
     exists. */
  onDelete?: (specialization: StructureSpecialization) => void;
}

/* Full-width row card. The body links to the specialization's restrictions
   editor; delete, when it exists, is a *sibling* of the link rather than a
   child, so the two click targets stay separate. */
export const SpecializationRow = ({
  specialization,
  onDelete,
}: SpecializationRowProps) => (
  <Panel className="flex items-center gap-4 px-4 py-3 transition-colors duration-(--std-duration) hover:bg-accent-pale-hover sm:px-6 sm:py-3">
    <Link
      to={`/admin/specializations/${specialization.id}/restrictions`}
      className="flex min-w-0 flex-1 items-center gap-4 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
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
    </Link>

    {onDelete && (
      <Button
        variant="destructive"
        size="xs"
        onClick={() => onDelete(specialization)}
      >
        Удалить
      </Button>
    )}
  </Panel>
);
