import { Plus } from "lucide-react";

interface AddCourseButtonProps {
  onClick?: () => void;
}

export const AddCourseButton = ({ onClick }: AddCourseButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-4 text-base font-medium text-fg-primary transition-colors hover:border-border-hover hover:text-fg-hover"
    >
      <Plus className="size-5" />
      Курс
    </button>
  );
};
