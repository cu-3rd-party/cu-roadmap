import type { Course } from "@/entities/course";
import { Label } from "@/shared/ui/kit/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";

interface TargetCourseSelectProps {
  courses: Course[];
  value: string;
  onChange: (id: string) => void;
}

export function TargetCourseSelect({
  courses,
  value,
  onChange,
}: TargetCourseSelectProps) {
  return (
    <div className="flex flex-col gap-2 flex-1">
      <Label className="text-xs font-bold uppercase text-muted-foreground">
        Целевой курс
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Выберите курс..." />
        </SelectTrigger>
        <SelectContent>
          {courses.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
