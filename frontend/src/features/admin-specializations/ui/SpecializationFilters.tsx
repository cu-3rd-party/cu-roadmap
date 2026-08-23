import type { StructureMajor } from "@/entities/major";
import { cn } from "@/shared/lib";
import { Button, Tabs, TabsList, TabsTrigger } from "@/shared/ui";

interface SpecializationFiltersProps {
  years: number[];
  currentYear: number | null;
  onYearChange: (year: number) => void;
  majors: StructureMajor[];
  majorId: string | null;
  onMajorChange: (majorId: string) => void;
  onAddSpecialization: () => void;
  creating?: boolean;
  className?: string;
}

// Equal-width pills, same as every other segmented row in the app.
const listClassName = "grid grid-flow-col auto-cols-fr";

export const SpecializationFilters = ({
  years,
  currentYear,
  onYearChange,
  majors,
  majorId,
  onMajorChange,
  onAddSpecialization,
  creating = false,
  className,
}: SpecializationFiltersProps) => (
  <div className={cn("flex flex-wrap items-center gap-3", className)}>
    {/* Radix Tabs speak strings; the cohort year is a number everywhere else.
        Both values fall back to "" so the rows render unselected rather than
        uncontrolled while the structure query is still in flight. */}
    <Tabs
      value={currentYear === null ? "" : String(currentYear)}
      onValueChange={(value) => onYearChange(Number(value))}
      className="min-w-0 flex-1"
    >
      <TabsList className={listClassName}>
        {years.map((admissionYear) => (
          <TabsTrigger key={admissionYear} value={String(admissionYear)}>
            {admissionYear}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>

    <Tabs
      value={majorId ?? ""}
      onValueChange={onMajorChange}
      className="min-w-0 flex-1"
    >
      <TabsList className={listClassName}>
        {majors.map((major) => (
          <TabsTrigger key={major.id} value={major.id}>
            {major.title}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>

    <Button
      variant="outline"
      size="sm"
      loading={creating}
      disabled={majorId === null}
      onClick={onAddSpecialization}
    >
      Добавить специализацию
    </Button>
  </div>
);
