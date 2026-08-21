import { Route as RouteIcon } from "lucide-react";
import { useState } from "react";

import {
  MOCK_MAJOR_TABS,
  MOCK_SPECIALIZATIONS,
  SpecializationList,
  TrajectoryFilters,
} from "@/features/admin-trajectories";
import { ADMISSION_YEARS, type AdmissionYear } from "@/shared/constants";
import { useMediaQuery } from "@/shared/lib";
import { Chip, Panel } from "@/shared/ui";

// Entry screen of the trajectories flow: pick a cohort year and a major, then
// work through that pair's specializations. Data is mocked until the admin
// majors/specializations endpoints land.
export default function TrajectoriesPage() {
  const isMobile = useMediaQuery("md");
  const [year, setYear] = useState<AdmissionYear>(ADMISSION_YEARS[0]);
  const [majorId, setMajorId] = useState(MOCK_MAJOR_TABS[0].id);

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
        <TrajectoryFilters
          year={year}
          onYearChange={setYear}
          majors={MOCK_MAJOR_TABS}
          majorId={majorId}
          onMajorChange={setMajorId}
          onAddSpecialization={() => {}}
        />
      </Panel>

      <SpecializationList specializations={MOCK_SPECIALIZATIONS} />
    </div>
  );
}
