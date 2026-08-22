import { ADMISSION_YEARS, type AdmissionYear } from "@/shared/constants";
import { cn } from "@/shared/lib";
import { Button, Tabs, TabsList, TabsTrigger } from "@/shared/ui";

import type { MajorTab } from "../model";

interface TrajectoryFiltersProps {
  year: AdmissionYear;
  onYearChange: (year: AdmissionYear) => void;
  majors: MajorTab[];
  majorId: string;
  onMajorChange: (majorId: string) => void;
  onAddSpecialization: () => void;
  className?: string;
}

// Equal-width pills, same as every other segmented row in the app.
const listClassName = "grid grid-flow-col auto-cols-fr";

export const TrajectoryFilters = ({
  year,
  onYearChange,
  majors,
  majorId,
  onMajorChange,
  onAddSpecialization,
  className,
}: TrajectoryFiltersProps) => (
  <div className={cn("flex flex-wrap items-center gap-3", className)}>
    {/* Radix Tabs speak strings; the cohort year is a number everywhere else. */}
    <Tabs
      value={String(year)}
      onValueChange={(value) => onYearChange(Number(value) as AdmissionYear)}
      className="min-w-0 flex-1"
    >
      <TabsList className={listClassName}>
        {ADMISSION_YEARS.map((admissionYear) => (
          <TabsTrigger key={admissionYear} value={String(admissionYear)}>
            {admissionYear}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>

    <Tabs
      value={majorId}
      onValueChange={onMajorChange}
      className="min-w-0 flex-1"
    >
      <TabsList className={listClassName}>
        {majors.map((major) => (
          <TabsTrigger key={major.id} value={major.id}>
            {major.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>

    <Button variant="outline" size="sm" onClick={onAddSpecialization}>
      Добавить специализацию
    </Button>
  </div>
);
