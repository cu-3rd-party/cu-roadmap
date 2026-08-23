import { Route as RouteIcon } from "lucide-react";
import { useState } from "react";

import { useStructureQuery } from "@/entities/major";
import {
  SpecializationFilters,
  SpecializationList,
  useCreateSpecializationMutation,
} from "@/features/admin-specializations";
import { useMediaQuery } from "@/shared/lib";
import { Chip, Panel } from "@/shared/ui";

// Entry screen of the specializations flow: pick a cohort year and a major,
// then work through that pair's specializations. One GET /majors/structure call
// backs all three levels.
const SpecializationsPage = () => {
  const isMobile = useMediaQuery("md");
  const { data: structure, isLoading, error } = useStructureQuery();

  /* Both stay null until the tree arrives, then fall back to the first year and
     that year's first major. Keeping them null (rather than seeding from a
     constant) means the tabs never point at a year the backend does not have. */
  const [yearOverride, setYearOverride] = useState<number | null>(null);
  const [majorOverride, setMajorOverride] = useState<string | null>(null);

  const years = structure ?? [];
  const currentYear =
    years.find(({ year: value }) => value === yearOverride)?.year ??
    years[0]?.year ??
    null;

  const majors =
    years.find(({ year: value }) => value === currentYear)?.majors ?? [];
  const majorId =
    majors.find(({ id }) => id === majorOverride)?.id ?? majors[0]?.id ?? null;

  const specializations = majors.find(
    ({ id }) => id === majorId,
  )?.specializations;

  const { mutate: addSpecialization, isPending: creating } =
    useCreateSpecializationMutation();

  /* Changing the year drops the major selection in the same update, so there is
     never a render where the selected major belongs to a different cohort. */
  const handleYearChange = (next: number) => {
    setYearOverride(next);
    setMajorOverride(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2">
      <Panel className="flex flex-col gap-4 px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col gap-3 px-1">
          <div className="flex w-full gap-4 h-10 items-center">
            <Chip variant="blue" size={isMobile ? "xs" : "sm"}>
              <RouteIcon />
            </Chip>
            <h1 className="text-2xl font-bold text-fg-primary">
              Специализации
            </h1>
          </div>

          <div className="text-sm text-fg-secondary">
            <p>Управление курсами в специализациях</p>
          </div>
        </div>
      </Panel>

      <Panel className="px-2 py-3 sm:px-4 sm:py-3 lg:px-6">
        <SpecializationFilters
          years={years.map(({ year: value }) => value)}
          currentYear={currentYear}
          onYearChange={handleYearChange}
          majors={majors}
          majorId={majorId}
          onMajorChange={setMajorOverride}
          onAddSpecialization={() => majorId && addSpecialization(majorId)}
          creating={creating}
        />
      </Panel>

      <SpecializationList
        specializations={specializations}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};

export default SpecializationsPage;
