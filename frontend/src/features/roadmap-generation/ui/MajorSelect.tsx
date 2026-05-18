import type { Major } from "@/entities/major";
import { Label } from "@/shared/ui/kit/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";

interface MajorSelectProps {
  majors: Major[];
  selectedMajor: string;
  onChange: (id: string) => void;
}

export function MajorSelect({
  majors,
  selectedMajor,
  onChange,
}: MajorSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-bold uppercase text-muted-foreground">
        Целевое направление (Major)
      </Label>
      <Select value={selectedMajor} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Выберите направление..." />
        </SelectTrigger>
        <SelectContent>
          {majors.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
