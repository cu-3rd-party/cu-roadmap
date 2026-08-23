import { Save } from "lucide-react";

import { useMediaQuery } from "@/shared/lib";
import { Button, Skeleton } from "@/shared/ui";

interface CourseEditHeaderProps {
  title: string;
  description: string;
  loading?: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  /* Shown only when the course differs from the one that loaded. */
  dirty?: boolean;
  /* Not wired yet — the button is inert until the save lands. */
  onSave?: () => void;
}

/* Borderless inputs rather than the kit `Input`: that one is a <label> wrapper
   carrying a border, a hover tint and focus-within rules, all of which would
   have to be overridden to look like the heading it replaces. */
const FIELD_CLASS =
  "w-full rounded-md bg-transparent px-1 outline-none transition-colors hover:bg-accent-pale-hover focus:bg-accent-pale-hover focus-visible:ring-2 focus-visible:ring-ring";

export const CourseEditHeader = ({
  title,
  description,
  loading = false,
  onTitleChange,
  onDescriptionChange,
  dirty = false,
  onSave,
}: CourseEditHeaderProps) => {
  const isMobile = useMediaQuery("md");

  return (
    <div className="flex flex-col gap-1 px-1">
      <div className="flex items-center gap-4">
        {loading ? (
          <Skeleton className="h-9 w-96 max-w-full" />
        ) : (
          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            aria-label="Название курса"
            placeholder="Название курса"
            className={`${FIELD_CLASS} text-2xl font-bold text-fg-primary`}
          />
        )}

        {dirty && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            icon={isMobile ? <Save /> : undefined}
            aria-label="Сохранить изменения"
            onClick={onSave}
          >
            {isMobile ? undefined : "Сохранить изменения"}
          </Button>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-6 w-2/3" />
      ) : (
        <input
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          aria-label="Описание курса"
          placeholder="Здесь текст для модераторов, его можно менять"
          className={`${FIELD_CLASS} text-sm text-fg-secondary`}
        />
      )}
    </div>
  );
};
