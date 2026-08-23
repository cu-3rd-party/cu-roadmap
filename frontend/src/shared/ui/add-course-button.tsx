import { Plus } from "lucide-react";

import { cn } from "@/shared/lib";

interface AddCourseButtonProps {
  onClick?: () => void;
  /**
   - full (default): wide button spanning the row (empty semester).
   - card: course-card-sized tile, used as the last cell in a populated grid.
  **/
  variant?: "full" | "card";
  /* Defaults to the planner's wording; the admin course editor adds boxes too. */
  label?: string;
}

export const AddCourseButton = ({
  onClick,
  variant = "full",
  label = "Курс",
}: AddCourseButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-[16px] border border-border bg-background font-medium text-fg-primary transition-[border-color] duration-(--std-duration)",
        "hover:border-border-hover hover:text-fg-hover cursor-pointer",
        variant === "full"
          ? "w-full px-4 py-4 text-base"
          : "h-full min-h-24 w-full p-4 text-sm",
      )}
    >
      <Plus className={cn(variant === "full" ? "size-5" : "size-6")} />
      {label}
    </button>
  );
};
