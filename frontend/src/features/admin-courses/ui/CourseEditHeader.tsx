import { Settings } from "lucide-react";

import { Button, Skeleton } from "@/shared/ui";

interface CourseEditHeaderProps {
  title?: string;
  description?: string | null;
  loading?: boolean;
  onSettings?: () => void;
}

export const CourseEditHeader = ({
  title,
  description,
  loading = false,
  onSettings,
}: CourseEditHeaderProps) => (
  <div className="flex flex-col gap-1 px-1">
    <div className="flex items-center gap-2">
      {loading ? (
        <Skeleton className="h-8 w-96 max-w-full" />
      ) : (
        <h1 className="text-2xl font-bold text-fg-primary">{title}</h1>
      )}
      <Button
        variant="tertiary"
        size="xs"
        icon={<Settings />}
        aria-label="Настройки курса"
        onClick={onSettings}
      />
    </div>

    {loading ? (
      <Skeleton className="h-5 w-2/3" />
    ) : (
      <p className="text-sm text-fg-secondary">
        {description?.trim() ? description : "Описание"}
      </p>
    )}
  </div>
);
