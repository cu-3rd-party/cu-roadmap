import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";

interface SemesterSelectorProps {
  value: number;
  onChange: (sem: number) => void;
}

export function SemesterSelector({ value, onChange }: SemesterSelectorProps) {
  return (
    <div className="flex flex-col gap-2 w-44">
      <Label className="text-xs font-bold uppercase text-muted-foreground">
        Текущий семестр
      </Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        min={1}
        max={8}
      />
    </div>
  );
}
