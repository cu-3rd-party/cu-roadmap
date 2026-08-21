import { X } from "lucide-react";

import { Chip } from "@/shared/ui";

// Round pale-red button shown at the end of a card's chip row to clear that
// card's selection. Sized to match the option chips (`rounded-full size-8`).
export const ClearChip = ({ onClick }: { onClick: () => void }) => (
  <Chip
    variant="red"
    size="xs"
    onClick={onClick}
    aria-label="Очистить"
    className="rounded-full size-8 cursor-pointer hover:opacity-80 hover:text-fg-negative"
  >
    <X />
  </Chip>
);
